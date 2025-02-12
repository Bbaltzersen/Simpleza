import os
import uuid
import redis
import argon2
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.user import User

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
ph = argon2.PasswordHasher()

def create_user(db: Session, username: str, email: str, hashed_password: str):
    user = User(
        user_id=uuid.uuid4(),
        username=username,
        email=email,
        hashed_password=hashed_password,
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db: Session, user_id: uuid.UUID):
    return db.query(User).filter(User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def update_user(db: Session, user_id: uuid.UUID, **kwargs):
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
    return user

def delete_user_by_id(db: Session, user_id: uuid.UUID):
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def delete_user_by_email(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def store_token(user_id: uuid.UUID, token: str, expires_in=3600):
    r.setex(f"token:{user_id}", expires_in, token)

def validate_token(user_id: uuid.UUID, token: str):
    stored_token = r.get(f"token:{user_id}")
    return stored_token == token

def revoke_token(user_id: uuid.UUID):
    r.delete(f"token:{user_id}")