from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import uuid
from database.connection import SessionLocal
from models.ingredient import Ingredient
from schemas.ingredient import IngredientCreate, IngredientOut, IngredientSchema

router = APIRouter(tags=["ingredients"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Fetch all ingredients
@router.get("/", response_model=List[IngredientOut])
def get_all_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    return ingredients

# ✅ Fetch a specific ingredient by ID
@router.get("/{ingredient_id}", response_model=IngredientOut)
def get_ingredient(ingredient_id: str, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

# ✅ Create a new ingredient (if it doesn’t exist)
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

# ✅ Delete an ingredient by ID
@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: str, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    db.delete(ingredient)
    db.commit()

    return {"message": "Ingredient deleted successfully"}

@router.get("/", response_model=List[IngredientSchema])
def search_ingredients(
    search: str = Query(..., min_length=3),
    db: Session = Depends(get_db)
):
    # Use similarity() to filter ingredients that are at least 40% similar
    ingredients = (
        db.query(Ingredient)
          .filter(func.similarity(Ingredient.name, search) >= 0.8)
          .order_by(func.similarity(Ingredient.name, search).desc())
          .limit(10)
          .all()
    )
    return ingredients