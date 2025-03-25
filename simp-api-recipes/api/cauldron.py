from typing import List
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
