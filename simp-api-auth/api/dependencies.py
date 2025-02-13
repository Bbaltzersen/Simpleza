import os
import jwt
from fastapi import HTTPException, Request, Depends
from jwt import ExpiredSignatureError, InvalidTokenError
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.handling import validate_token, get_user_by_id

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/authentication/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id or not validate_token(user_id, token):
            raise HTTPException(status_code=401, detail="Invalid token")
        user_details = get_user_by_id(db, user_id)
        if not user_details:
            raise HTTPException(status_code=404, detail="User details not found")
        return {
            "user_id": user_details.user_id,
            "username": user_details.username,
            "email": user_details.email,
            "role": user_details.role,
        }
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
