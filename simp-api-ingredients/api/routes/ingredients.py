from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict
import uuid

from database.connection import SessionLocal
from models.ingredient import Ingredient
from models.ingredient_nutrition import IngredientNutrition
from models.ingredient_product import IngredientProduct
from models.nutrition import Nutrition
from models.product import Product
from schemas.ingredient import IngredientCreate, IngredientOut

router = APIRouter(prefix="", tags=["Ingredients"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    existing_ingredient = db.query(Ingredient).filter(Ingredient.name == ingredient.name).first()
    if existing_ingredient:
        return existing_ingredient  

    new_ingredient = Ingredient(
        name=ingredient.name,
        default_unit=ingredient.default_unit,
        calories_per_100g=ingredient.calories_per_100g
    )

    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)

    return IngredientOut(
        ingredient_id=new_ingredient.ingredient_id,
        name=new_ingredient.name,
        default_unit=new_ingredient.default_unit,
        calories_per_100g=float(new_ingredient.calories_per_100g) if new_ingredient.calories_per_100g is not None else None
    )

@router.get("/", response_model=Dict[str, List[IngredientOut] | int])
def read_ingredients(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    total_ingredients = db.query(Ingredient).count()
    ingredients = db.query(Ingredient).offset(skip).limit(limit).all()

    return {
        "ingredients": ingredients,
        "total": total_ingredients
    }

@router.get("/{ingredient_id}", response_model=IngredientOut)
def read_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

@router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(ingredient_id: uuid.UUID, ingredient_update: IngredientCreate, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    ingredient.name = ingredient_update.name
    ingredient.default_unit = ingredient_update.default_unit
    ingredient.calories_per_100g = ingredient_update.calories_per_100g

    db.commit()
    db.refresh(ingredient)
    return ingredient

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    db.delete(ingredient)
    db.commit()
    return None
