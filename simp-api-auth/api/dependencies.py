import os
import jwt
import re
import secrets
import argon2
from datetime import datetime, timedelta, UTC
from fastapi import HTTPException, Request, Depends
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database.connection import SessionLocal
from database.handling import (
    get_user_by_id, validate_user_session, validate_csrf_token
)

load_dotenv()

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing from environment variables!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
ph = argon2.PasswordHasher()

def get_db():
    """ Dependency to get database session """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_csrf_token():
    return secrets.token_hex(32)

def create_access_token(user_id: str):
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str):
    expire = datetime.now(UTC) + timedelta(days=7)  # Default 7 days
    payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def validate_password(password: str):
    """ Validate password security requirements """
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

def get_current_user(request: Request, db: Session = Depends(get_db)):
    """ Validate user authentication, session, and CSRF protection """
    token = request.cookies.get("auth_token")
    csrf_token_header = request.headers.get("X-CSRF-Token")
    csrf_token_cookie = request.cookies.get("csrf_token")  # Retrieve from cookies

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not validate_user_session(user_id, token):
            raise HTTPException(status_code=401, detail="Invalid token")

        # Use CSRF token from header, but fallback to cookie if not provided
        csrf_token = csrf_token_header or csrf_token_cookie
        if not csrf_token or not validate_csrf_token(user_id, csrf_token):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")

        user_details = get_user_by_id(db, user_id)
        if not user_details:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user_id": user_details.user_id,
            "username": user_details.username,
            "email": user_details.email,
            "role": user_details.role,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

