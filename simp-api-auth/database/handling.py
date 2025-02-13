import os
import uuid
import redis
import argon2
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.user import User

load_dotenv()

# Redis configuration
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
        role="user"  # Default role is "user"
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
        return True
    return False

# Token management using Redis
def store_token(user_id: str, token: str, expires_in=3600):
    r.setex(f"token:{user_id}", expires_in, token)

def validate_token(user_id: str, token: str):
    stored_token = r.get(f"token:{user_id}")
    return stored_token == token

def revoke_token(user_id: str):
    r.delete(f"token:{user_id}")

# Role management using Redis
def store_user_role(user_id: str, role: str, expires_in=3600):
    r.setex(f"user_role:{user_id}", expires_in, role)

def get_user_role(user_id: str):
    return r.get(f"user_role:{user_id}")

def revoke_user_role(user_id: str):
    r.delete(f"user_role:{user_id}")