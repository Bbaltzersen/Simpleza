import os
import uuid
import redis
import argon2
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.user import User

load_dotenv()

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
ph = argon2.PasswordHasher()

def create_user(db: Session, username: str, email: str, hashed_password: str):
    user = User(
        user_id=str(uuid.uuid4()),
        username=username,
        email=email,
        hashed_password=hashed_password,
        role="user"  
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def update_user(db: Session, user_id: str, **kwargs):
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: str):
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        revoke_user_session(user_id) 
        return True
    return False

def store_user_session(user_id: str, auth_token: str, refresh_token: str, csrf_token: str, access_expires_in=3600, refresh_expires_in=604800):
    """ Store access token, refresh token, and CSRF token in Redis """
    r.hset(f"user_session:{user_id}", mapping={
        "auth_token": auth_token,
        "refresh_token": refresh_token,  
        "csrf_token": csrf_token
    })

    r.expire(f"user_session:{user_id}", refresh_expires_in)  

def get_user_session(user_id: str):
    """ Retrieve auth token, refresh token, and CSRF token from Redis """
    session_data = r.hgetall(f"user_session:{user_id}")
    if not session_data:
        return None
    return {
        "auth_token": session_data.get("auth_token"),
        "refresh_token": session_data.get("refresh_token"),  
        "csrf_token": session_data.get("csrf_token"),
    }


def validate_user_session(user_id: str, auth_token: str):
    """ Validate auth token from Redis """
    session_data = get_user_session(user_id)
    return session_data and session_data.get("auth_token") == auth_token

def validate_csrf_token(user_id: str, csrf_token: str):
    """ Validate CSRF token from Redis """
    session_data = get_user_session(user_id)
    return session_data and session_data.get("csrf_token") == csrf_token


def revoke_user_session(user_id: str):
    """ Remove auth token & CSRF token from Redis """
    r.delete(f"user_session:{user_id}")

def store_user_role(user_id: str, role: str, expires_in=3600):
    """ Store user role separately in Redis """
    r.setex(f"user_role:{user_id}", expires_in, role)

def get_user_role(user_id: str):
    """ Retrieve user role from Redis """
    return r.get(f"user_role:{user_id}")

def revoke_user_role(user_id: str):
    """ Remove user role from Redis """
    r.delete(f"user_role:{user_id}")

def get_refresh_token(user_id: str):
    """ Retrieve the refresh token from Redis (from session storage) """
    session_data = r.hgetall(f"user_session:{user_id}")
    if not session_data:
        return None
    return session_data.get("refresh_token")  

def validate_refresh_token(user_id: str, refresh_token: str):
    """ Validate refresh token from Redis """
    stored_refresh_token = get_refresh_token(user_id)

    print(f"Stored Refresh Token: [{stored_refresh_token}]")  
    print(f"Received Refresh Token: [{refresh_token}]")  

    if stored_refresh_token and refresh_token:
        stored_refresh_token = stored_refresh_token.strip()
        refresh_token = refresh_token.strip()

    return stored_refresh_token == refresh_token

def revoke_refresh_token(user_id: str):
    """ Remove refresh token from Redis """
    r.delete(f"user_refresh:{user_id}")