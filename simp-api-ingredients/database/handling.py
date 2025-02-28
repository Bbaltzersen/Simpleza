import os
import redis
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models import User

load_dotenv()

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)


def get_user_by_id(db: Session, user_id: str):
    """Retrieve user details from the database."""
    return db.query(User).filter(User.user_id == user_id).first()


def store_user_session(user_id: str, auth_token: str, csrf_token: str, expires_in=3600):
    """Store access token and CSRF token in Redis."""
    r.hset(f"user_session:{user_id}", mapping={"auth_token": auth_token, "csrf_token": csrf_token})
    r.expire(f"user_session:{user_id}", expires_in)


def get_user_session(user_id: str):
    """Retrieve auth token and CSRF token from Redis."""
    session_data = r.hgetall(f"user_session:{user_id}")
    if not session_data:
        return None
    return {"auth_token": session_data.get("auth_token"), "csrf_token": session_data.get("csrf_token")}


def validate_user_session(user_id: str, auth_token: str):
    """Validate auth token from Redis."""
    session_data = get_user_session(user_id)
    return session_data and session_data.get("auth_token") == auth_token


def validate_csrf_token(user_id: str, csrf_token: str):
    """Validate CSRF token from Redis."""
    session_data = get_user_session(user_id)
    return session_data and session_data.get("csrf_token") == csrf_token


def revoke_user_session(user_id: str):
    """Remove auth token and CSRF token from Redis."""
    r.delete(f"user_session:{user_id}")


def store_user_role(user_id: str, role: str, expires_in=3600):
    """Store user role in Redis."""
    r.setex(f"user_role:{user_id}", expires_in, role)


def get_user_role(user_id: str):
    """Retrieve user role from Redis."""
    return r.get(f"user_role:{user_id}")


def revoke_user_role(user_id: str):
    """Remove user role from Redis."""
    r.delete(f"user_role:{user_id}")
