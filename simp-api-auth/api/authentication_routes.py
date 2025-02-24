import os
import secrets
import jwt
import argon2
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Import centralized dependencies and schema
from api.dependencies import (
    get_db,
    get_current_user,
    create_access_token,
    create_refresh_token,
    validate_password,
)
from models.schemas import UserResponse, UserCreate
from database.handling import (
    create_user,
    get_user_by_username,
    get_user_by_email,
    delete_user,
    store_user_role,
    revoke_user_session,
    validate_refresh_token,
    get_user_session,
)

load_dotenv()

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

router = APIRouter()
ph = argon2.PasswordHasher()


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
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = get_user_by_username(db, form_data.username)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    try:
        if not ph.verify(db_user.hashed_password, form_data.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    except (argon2.exceptions.VerifyMismatchError, argon2.exceptions.VerificationError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    # Generate tokens and CSRF token
    access_token = create_access_token(db_user.user_id)
    refresh_token = create_refresh_token(db_user.user_id)
    csrf_token = secrets.token_hex(32)
    
    # Store session and user role (assumes proper handling in your session store)
    from database.handling import store_user_session  # Import here if not already in dependencies
    store_user_session(
        db_user.user_id,
        access_token,
        refresh_token,
        csrf_token,
        access_expires_in=3600,
        refresh_expires_in=604800
    )
    store_user_role(db_user.user_id, db_user.role, expires_in=3600)
    
    # Set cookies (HTTPOnly for tokens; csrf_token is accessible by JS)
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
        httponly=True,
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
def refresh_token_endpoint(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    try:
        payload = jwt.decode(refresh_token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
        user_id = payload.get("sub")
        from database.handling import validate_refresh_token  # Import if needed
        if not validate_refresh_token(user_id, refresh_token):
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        session_data = get_user_session(user_id)
        if not session_data or not session_data.get("refresh_token"):
            raise HTTPException(status_code=401, detail="Session expired or refresh token missing")
        
        new_access_token = create_access_token(user_id)
        from database.handling import store_user_session  # Import if needed
        store_user_session(
            user_id,
            new_access_token,
            session_data["refresh_token"] or refresh_token,
            session_data["csrf_token"],
            access_expires_in=3600,
            refresh_expires_in=604800
        )
        
        response.set_cookie(
            key="auth_token",
            value=new_access_token,
            httponly=True,
            secure=IS_PRODUCTION,
            samesite="Lax",
            max_age=3600,
        )
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    request: Request,
    x_csrf_token: str = Header(...),
    user_data: dict = Depends(get_current_user)
):
    csrf_token_cookie = request.cookies.get("csrf_token")
    if not x_csrf_token or x_csrf_token != csrf_token_cookie:
        raise HTTPException(status_code=403, detail="Invalid CSRF token")
    
    user_id = user_data["user_id"]
    revoke_user_session(user_id)
    
    response.delete_cookie("auth_token", secure=IS_PRODUCTION)
    response.delete_cookie("refresh_token", secure=IS_PRODUCTION)
    response.delete_cookie("csrf_token", secure=IS_PRODUCTION)
    
    return {"message": "Logout successful"}


@router.get("/protected", status_code=status.HTTP_200_OK)
def protected_route(user_data: dict = Depends(get_current_user)):
    return {"message": "Access granted", "user": user_data}


@router.delete("/delete-user/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_account(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if user_id != current_user.get("user_id"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this account")
    if not delete_user(db, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or failed to delete")
    revoke_user_session(user_id)
    return {"message": "User deleted successfully"}
