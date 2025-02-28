from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import uuid

from database.connection import SessionLocal
from models.ingredient import Ingredient
from models.product import Product
from models.ingredient_product import IngredientProduct
from models.ingredient_nutrition import IngredientNutrition
from models.density import Density
from models.approximate_measurement import ApproximateMeasurement
from schemas.ingredient import IngredientCreate, IngredientOut, IngredientUpdate
from schemas.approximate_measurement import ApproximateMeasurementCreate, ApproximateMeasurementOut

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[IngredientOut])
def get_ingredients(
    db: Session = Depends(get_db),
    skip: int = Query(0, alias="offset"),
    limit: int = Query(10, alias="limit"),
):
    """ Retrieve a paginated list of ingredients. """
    ingredients = db.query(Ingredient).offset(skip).limit(limit).all()
    return ingredients

@router.get("/{ingredient_id}", response_model=IngredientOut)
def get_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Retrieve a single ingredient by ID. """
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

@router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(ingredient_id: uuid.UUID, ingredient_update: IngredientUpdate, db: Session = Depends(get_db)):
    """ Update ingredient details. """
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    ingredient.name = ingredient_update.name or ingredient.name
    ingredient.default_unit = ingredient_update.default_unit or ingredient.default_unit
    ingredient.calories_per_100g = ingredient_update.calories_per_100g or ingredient.calories_per_100g
    
    try:
        db.commit()
        db.refresh(ingredient)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ingredient name must be unique")
    
    return ingredient

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Delete an ingredient and remove all links but keep related entities. """
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # Remove related links
    db.query(IngredientProduct).filter(IngredientProduct.ingredient_id == ingredient_id).delete()
    db.query(IngredientNutrition).filter(IngredientNutrition.ingredient_id == ingredient_id).delete()
    db.query(ApproximateMeasurement).filter(ApproximateMeasurement.ingredient_id == ingredient_id).delete()
    db.query(Density).filter(Density.ingredient_id == ingredient_id).delete()
    
    # Delete ingredient
    db.delete(ingredient)
    db.commit()
    
    return {"detail": "Ingredient deleted successfully"}
