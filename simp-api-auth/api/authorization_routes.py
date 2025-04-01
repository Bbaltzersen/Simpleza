from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.dependencies import get_db, get_current_user
from database.handling import get_user_by_id

router = APIRouter()


@router.get("/user-role/{user_id}")
def get_user_role(user_id: str, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with user ID: {user_id} not found")
    return {"role": user.role}


def is_authorized(required_role: str):
    def role_checker(user_data: dict = Depends(get_current_user)):
        if user_data.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Access denied")
        return user_data
    return role_checker


@router.get("/admin-only")
def admin_dashboard(user_data: dict = Depends(is_authorized("ADMIN"))):
    return {"message": f"Welcome, Admin {user_data.get('user_id')}!"}


@router.get("/user-only")
def user_dashboard(user_data: dict = Depends(is_authorized("USER"))):
    return {"message": f"Welcome, user {user_data.get('user_id')}!"}
