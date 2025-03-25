from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import uuid
from database.connection import SessionLocal
from models.ingredient import Ingredient
from schemas.ingredient import IngredientCreate, IngredientOut, IngredientSchema

router = APIRouter(tags=["cauldrons"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

        from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from database.connection import SessionLocal
from models.cauldron import Cauldron as CauldronModel
from schemas.cauldron import CauldronCreate, Cauldron

router = APIRouter(tags=["cauldrons"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/cauldrons", response_model=Cauldron)
def create_cauldron(cauldron_create: CauldronCreate, db: Session = Depends(get_db)):
    # Optionally, add logic to verify that the recipe exists
    # or check if a cauldron for this user and recipe already exists.
    
    new_cauldron = CauldronModel(
        user_id=cauldron_create.user_id,
        recipe_id=cauldron_create.recipe_id,
        is_active=cauldron_create.is_active
    )
    db.add(new_cauldron)
    db.commit()
    db.refresh(new_cauldron)
    
    return new_cauldron

@router.get("/user/{user_id}", response_model=Dict[str, List[Cauldron] | int])
def read_cauldrons_by_user(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # Query to count total cauldron records for the user.
    total_cauldrons = db.query(CauldronModel).filter(CauldronModel.user_id == user_id).count()

    # Retrieve the paginated list of cauldrons.
    cauldrons = (
        db.query(CauldronModel)
        .filter(CauldronModel.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "cauldrons": cauldrons,
        "total": total_cauldrons
    }

@router.delete("/{cauldron_id}", response_model=dict)
def delete_cauldron(cauldron_id: uuid.UUID, db: Session = Depends(get_db)):
    cauldron_obj = db.query(CauldronModel).filter(CauldronModel.cauldron_id == cauldron_id).first()
    if not cauldron_obj:
        raise HTTPException(status_code=404, detail="Cauldron not found")
    
    db.delete(cauldron_obj)
    db.commit()
    
    return {"detail": "Cauldron deleted successfully"}