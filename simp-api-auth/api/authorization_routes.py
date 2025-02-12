from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.handling import get_user_by_id
from api.dependencies import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/user-role/{user_id}")
def get_user_role(user_id: str, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)  
    if not user:
        raise HTTPException(status_code=404, detail=f"User with user ID: {user_id} not found")
    return {"role": user.role}

def is_authorized(required_role: str):
    def role_checker(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
        user = get_user_by_id(db, user_id)  
        if not user or user.role != required_role:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return role_checker

@router.get("/admin-only")
def admin_dashboard(user: str = Depends(is_authorized("admin"))):
    return {"message": "Welcome, Admin!"}