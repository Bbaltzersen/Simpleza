import os
import argon2
from models.schemas import UserResponse, UserCreate
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Import dependencies
from api.dependencies import get_db, get_current_user, create_access_token, validate_password
from database.handling import (
    create_user, get_user_by_username, get_user_by_email, delete_user,
    store_user_role, revoke_user_session
)
from api.routes.loginRoute import router as login_router  

load_dotenv()

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

router = APIRouter()
ph = argon2.PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/authentication/login")

# Include login routes inside authentication router
router.include_router(login_router, prefix="")

# ===========================
#  User Registration
# ===========================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_200_OK)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """ Register a new user and hash password securely """
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    validate_password(user.password)  # Now imported from dependencies

    hashed_password = ph.hash(user.password)
    new_user = create_user(db, user.username, user.email, hashed_password)

    return UserResponse(
        user_id=new_user.user_id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role
    )

# ===========================
#  Protected Route Example
# ===========================
@router.get("/protected", status_code=status.HTTP_200_OK)
def protected_route(user_data: dict = Depends(get_current_user)):
    """ Example of a protected route requiring authentication """
    return {"user": user_data}

# ===========================
#  Delete User Account
# ===========================
@router.delete("/delete-user/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_account(user_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """ Allows a user to delete their account (if authorized) """
    current_user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this account")

    if not delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found or failed to delete")
    
    revoke_user_session(user_id)
    return {"message": "User deleted successfully"}
