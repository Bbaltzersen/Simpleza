import os
import argon2
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from models.schemas import UserResponse, UserCreate
from api.dependencies import get_db, get_current_user, create_access_token, validate_password
from database.handling import (
    create_user, get_user_by_username, get_user_by_email, delete_user,
    store_user_role, revoke_user_session
)
from api.routes.loginRoute import router as login_router  

load_dotenv()

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

router = APIRouter()
ph = argon2.PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/authentication/login")

router.include_router(login_router, prefix="")

@router.options("/protected")
async def options_protected(request: Request):
    print("\n🔹 OPTIONS Request for /protected")
    print(f"🔹 Headers: {dict(request.headers)}")

    if "origin" not in request.headers:
        print("❌ ERROR: Missing Origin Header")
        return {"error": "Missing Origin Header"}

    origin = request.headers["origin"]
    if origin not in ALLOWED_ORIGINS:
        print(f"❌ ERROR: Origin {origin} is not allowed")
        return {"error": f"Origin {origin} is not allowed"}

    print("✅ OPTIONS /protected Handled Successfully")
    return {
        "message": "Preflight request handled successfully",
        "allowed_methods": ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
        "allowed_headers": ["Content-Type", "X-CSRF-Token", "Authorization"],
        "allow_credentials": True
    }

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

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
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, form_data.username)

    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    try:
        if not ph.verify(db_user.hashed_password, form_data.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    except argon2.exceptions.VerifyMismatchError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    access_token = create_access_token(db_user.user_id)

    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="Lax",
        max_age=3600,
    )

    return {"message": "Login successful"}

@router.get("/protected", status_code=status.HTTP_200_OK)
def protected_route(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("auth_token")

    if not token:
        print("❌ ERROR: Missing authentication token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    user_data = get_current_user(token)
    print("✅ Access Granted")
    return {"message": "Access granted", "user": user_data}

@router.delete("/delete-user/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_account(user_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    current_user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user
    if user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this account")

    if not delete_user(db, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or failed to delete")
    
    revoke_user_session(user_id)
    return {"message": "User deleted successfully"}
