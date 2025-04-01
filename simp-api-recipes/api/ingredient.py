from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import uuid
from database.connection import SessionLocal
from models.database_tables import Ingredient
from schemas.ingredient import IngredientCreate, IngredientOut, IngredientSchema

router = APIRouter(tags=["ingredients"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[IngredientOut])
def get_all_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    return ingredients

@router.get("/{ingredient_id}", response_model=IngredientOut)
def get_ingredient(ingredient_id: str, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

@router.post("/", response_model=IngredientOut)
def create_ingredient(ingredient_data: IngredientCreate, db: Session = Depends(get_db)):
    existing_ingredient = db.query(Ingredient).filter(Ingredient.name == ingredient_data.name).first()

    if existing_ingredient:
        raise HTTPException(status_code=400, detail="Ingredient already exists")

    new_ingredient = Ingredient(
        ingredient_id=str(uuid.uuid4()),
        name=ingredient_data.name,
    )

    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)

    return new_ingredient

@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: str, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    db.delete(ingredient)
    db.commit()

    return {"message": "Ingredient deleted successfully"}

@router.get("/by-name/", response_model=List[IngredientSchema])
def search_ingredients(
    search: str = Query(..., min_length=3),
    db: Session = Depends(get_db)
):
    # ✅ Use `word_similarity()` for better ranking
    ingredients = (
        db.query(Ingredient)
        .filter(func.similarity(Ingredient.name, search) >= 0.4)  # ✅ Adjust threshold if needed
        .order_by(func.word_similarity(Ingredient.name, search).desc())  # ✅ Ensure best match first
        .limit(10)
        .all()
    )

    return ingredients if ingredients else []