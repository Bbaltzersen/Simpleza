import os
import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database.connection import SessionLocal
from database.handling import get_user_session
from models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def get_db():
    """Dependency to provide a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Extracts and validates the current user based on the session token and CSRF token."""
    token = request.cookies.get("auth_token")
    csrf_token_header = request.headers.get("X-CSRF-Token")
    csrf_token_cookie = request.cookies.get("csrf_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        # Validate session using Redis
        session_data = get_user_session(user_id)
        if not session_data or session_data.get("auth_token") != token:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Validate CSRF token
        csrf_token = csrf_token_header or csrf_token_cookie
        if not csrf_token or session_data.get("csrf_token") != csrf_token:
            raise HTTPException(status_code=403, detail="Invalid CSRF token")

        # Retrieve user from database
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def is_authorized(required_role: str):
    """Dependency to enforce role-based authorization."""
    def role_checker(user_data: dict = Depends(get_current_user)):
        if user_data.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Access denied")
        return user_data
    return role_checker
