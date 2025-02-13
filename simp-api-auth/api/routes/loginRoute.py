import os
import secrets
import jwt
import argon2
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Import dependencies
from api.dependencies import get_db, create_access_token, create_refresh_token, get_current_user
from database.handling import (
    get_user_by_username, store_user_session, store_user_role, revoke_user_session, validate_refresh_token, get_user_session
)

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

router = APIRouter()
ph = argon2.PasswordHasher()

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """ Handles user login, session creation, access & refresh token storage """
    db_user = get_user_by_username(db, form_data.username)

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    try:
        if not ph.verify(db_user.hashed_password, form_data.password):
            raise HTTPException(status_code=401, detail="Invalid username or password")
    except (argon2.exceptions.VerifyMismatchError, argon2.exceptions.VerificationError):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token(db_user.user_id)
    refresh_token = create_refresh_token(db_user.user_id)
    csrf_token = secrets.token_hex(32)  # Generate CSRF token

    # Store session & role in Redis
    store_user_session(db_user.user_id, access_token, refresh_token, csrf_token, access_expires_in=3600, refresh_expires_in=604800)
    store_user_role(db_user.user_id, db_user.role, expires_in=60 * 60)

    # Set Secure Cookies with IS_PRODUCTION check
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="Lax",
        max_age=3600,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,  # Refresh token also HTTP-Only
        secure=IS_PRODUCTION,
        samesite="Lax",
        max_age=604800,
    )

    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=IS_PRODUCTION,
        samesite="Lax",
        max_age=3600,
    )

    return {"message": "Login successful"}

@router.post("/refresh-token")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """ Automatically refreshes the access token if the refresh token is valid """
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not validate_refresh_token(user_id, refresh_token):
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Get session data
        session_data = get_user_session(user_id)

        if not session_data or not session_data.get("refresh_token"):
            raise HTTPException(status_code=401, detail="Session expired or refresh token missing")

        # Issue a new access token
        new_access_token = create_access_token(user_id)

        # Update session in Redis (Ensure refresh_token is not None)
        store_user_session(
            user_id,
            new_access_token,
            session_data["refresh_token"] or refresh_token,  # Use stored or received refresh_token
            session_data["csrf_token"],
            access_expires_in=3600,
            refresh_expires_in=604800
        )

        # Set new access token cookie
        response.set_cookie(
            key="auth_token",
            value=new_access_token,
            httponly=True,
            secure=IS_PRODUCTION,
            samesite="Lax",
            max_age=3600,  # 1 hour expiration
        )

        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response, user_data: dict = Depends(get_current_user)):
    """ Handles user logout and session cleanup """
    user_id = user_data["user_id"]
    revoke_user_session(user_id)

    response.delete_cookie("auth_token", secure=IS_PRODUCTION)
    response.delete_cookie("refresh_token", secure=IS_PRODUCTION)
    response.delete_cookie("csrf_token", secure=IS_PRODUCTION)

    return {"message": "Logout successful"}
