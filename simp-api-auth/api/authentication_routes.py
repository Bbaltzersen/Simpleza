import os
import re
import argon2
import jwt
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from api.dependencies import get_current_user
from database.connection import SessionLocal
from database.handling import (
    create_user, get_user_by_username, get_user_by_email, delete_user,
    store_token, store_user_role, revoke_token
)
from models.schemas import UserCreate, UserResponse

load_dotenv()

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing from environment variables!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

router = APIRouter()
ph = argon2.PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/authentication/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(user_id: str):
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def validate_password(password: str):
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("Password must contain at least one special character.")
    
    if errors:
        raise HTTPException(status_code=400, detail={"password_errors": errors})
    
    return password

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_200_OK)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    validate_password(user.password)

    hashed_password = ph.hash(user.password)
    new_user = create_user(db, user.username, user.email, hashed_password)

    return UserResponse(
        user_id=new_user.user_id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role
    )

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, form_data.username)
    if not db_user or not ph.verify(db_user.hashed_password, form_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(db_user.user_id)

    # Store token and user role in Redis for role checking
    store_token(db_user.user_id, access_token, expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    store_user_role(db_user.user_id, db_user.role, expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="Lax",
        max_age=int(1.21e+6),
    )

    return {"message": "Login successful"}

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user

    revoke_token(user_id)

    response.delete_cookie(key="auth_token")
    
    return {"message": "Logout successful"}


@router.get("/protected", status_code=status.HTTP_200_OK)
def protected_route(user_data: dict = Depends(get_current_user)):
    return {"user": user_data}


@router.delete("/delete-user/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_account(user_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    current_user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this account")

    if not delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found or failed to delete")
    
    revoke_token(user_id)
    return {"message": "User deleted successfully"}
