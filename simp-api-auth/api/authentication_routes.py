import os
import re
import argon2
import jwt
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, HTTPException, Form, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from jwt import ExpiredSignatureError, InvalidTokenError

from database.connection import SessionLocal
from database.handling import (
    create_user, get_user_by_username, get_user_by_email, delete_user_by_email,
    store_token, validate_token, revoke_token
)
from models.schemas import UserCreate, UserResponse

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing from the environment variables!")

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
    return errors

class OAuth2EmailRequestForm(OAuth2PasswordRequestForm):
    def __init__(
        self,
        email: str = Form(..., description="Your registered email address"),
        password: str = Form(..., description="Your password"),
        scope: str = Form(""),
        client_id: str = Form(None),
        client_secret: str = Form(None)
    ):
        super().__init__(
            username=email,
            password=password,
            scope=scope,
            client_id=client_id,
            client_secret=client_secret
        )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_200_OK)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    password_errors = validate_password(user.password)
    if password_errors:
        raise HTTPException(status_code=400, detail={"password_errors": password_errors})

    hashed_password = ph.hash(user.password)
    new_user = create_user(db, user.username, user.email, hashed_password)

    return UserResponse(
        user_id=new_user.user_id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role
    )

@router.post("/login", status_code=status.HTTP_200_OK)
def login(
    form_data: OAuth2EmailRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    if not form_data.username or not form_data.password:
        raise HTTPException(status_code=422, detail="Missing email or password")

    db_user = get_user_by_email(db, form_data.username)  
    if not db_user or not ph.verify(db_user.hashed_password, form_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(db_user.user_id)
    store_token(db_user.user_id, access_token)

    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")  
        if not email or not validate_token(email, token):
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(email: str = Depends(get_current_user)):
    revoke_token(email)
    return {"message": "User logged out successfully"}

@router.get("/protected", status_code=status.HTTP_200_OK)
def protected_route(user_id: str = Depends(get_current_user)):
    return {"message": f"Hello, User {user_id}, you are authenticated."}

@router.delete("/delete-user/{email}", status_code=status.HTTP_200_OK)
def delete_user_account(email: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if email != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to delete this account")

    if not delete_user_by_email(db, email):
        raise HTTPException(status_code=404, detail="User not found or failed to delete")
    
    revoke_token(email)

    return {"message": "User deleted successfully"}
