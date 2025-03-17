from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict
import uuid
from decimal import Decimal

from database.connection import SessionLocal
from models.ingredient import Ingredient
from models.ingredient_nutrition import IngredientNutrition
from models.ingredient_product import IngredientProduct
from models.nutrition import Nutrition
from models.product import Product
from schemas.ingredient import IngredientCreate, IngredientOut, NutritionLink
from schemas.product import ProductOut
from schemas.nutrition import NutritionOut

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
        calories_per_100g=Decimal(ingredient.calories_per_100g) if ingredient.calories_per_100g is not None else None,
        validated=ingredient.validated,
        diet_level=ingredient.diet_level
    )

    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)

    return new_ingredient

@router.get("/", response_model=Dict[str, List[IngredientOut] | int])
def read_ingredients(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    total_ingredients = db.query(Ingredient).count()
    ingredients = db.query(Ingredient).offset(skip).limit(limit).all()

    return {
        "ingredients": [IngredientOut.model_validate(ingredient) for ingredient in ingredients],  # ✅ Convert to Pydantic model
        "total": total_ingredients
    }

@router.get("/{ingredient_id}", response_model=IngredientOut)
def read_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient.model_dump()

@router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(ingredient_id: uuid.UUID, ingredient_update: IngredientCreate, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    ingredient.name = ingredient_update.name
    ingredient.default_unit = ingredient_update.default_unit
    ingredient.calories_per_100g = Decimal(ingredient_update.calories_per_100g) if ingredient_update.calories_per_100g is not None else None
    ingredient.validated = ingredient_update.validated
    ingredient.diet_level = ingredient_update.diet_level

    db.commit()
    db.refresh(ingredient)
    return IngredientOut.model_validate(ingredient)  # ✅ Convert to Pydantic model

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    db.delete(ingredient)
    db.commit()
    return None

@router.post("/{ingredient_id}/link-product/{product_id}", status_code=status.HTTP_201_CREATED)
def link_ingredient_to_product(ingredient_id: uuid.UUID, product_id: uuid.UUID, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    product = db.query(Product).filter(Product.product_id == product_id).first()

    if not ingredient or not product:
        raise HTTPException(status_code=404, detail="Ingredient or Product not found")

    existing_link = db.query(IngredientProduct).filter(
        IngredientProduct.ingredient_id == ingredient_id,
        IngredientProduct.product_id == product_id
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Link already exists")

    new_link = IngredientProduct(ingredient_id=ingredient_id, product_id=product_id)
    db.add(new_link)
    db.commit()
    return {"message": "Product linked successfully"}

@router.get("/{ingredient_id}/products", response_model=List[ProductOut])
def get_ingredient_products(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    linked_products = (
        db.query(Product)
        .join(IngredientProduct, Product.product_id == IngredientProduct.product_id)
        .filter(IngredientProduct.ingredient_id == ingredient_id)
        .all()
    )

    return [product.model_dump() for product in linked_products] if linked_products else []

@router.post("/link-nutrition")
def link_nutrition_to_ingredient(link_data: NutritionLink, db: Session = Depends(get_db)):
    ingredient_nutrition = IngredientNutrition(
        ingredient_id=link_data.ingredient_id,
        nutrition_id=link_data.nutrition_id
    )

    db.add(ingredient_nutrition)
    db.commit()
    return {"message": "Nutrition linked successfully"} 

@router.get("/{ingredient_id}/nutritions", response_model=List[NutritionOut])
def get_ingredient_nutritions(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    linked_nutritions = (
        db.query(Nutrition)
        .join(IngredientNutrition, Nutrition.nutrition_id == IngredientNutrition.nutrition_id)
        .filter(IngredientNutrition.ingredient_id == ingredient_id)
        .all()
    )

    return [nutrition.model_dump() for nutrition in linked_nutritions] if linked_nutritions else []

@router.delete("/{ingredient_id}/detach-product/{product_id}")
def detach_product(ingredient_id: uuid.UUID, product_id: uuid.UUID, db: Session = Depends(get_db)):
    link = db.query(IngredientProduct).filter(
        IngredientProduct.ingredient_id == ingredient_id,
        IngredientProduct.product_id == product_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link between ingredient and product not found")

    db.delete(link)
    db.commit()
    return {"message": "Product detached from ingredient successfully"}

@router.delete("/{ingredient_id}/detach-nutrition/{nutrition_id}")
def detach_nutrition(ingredient_id: uuid.UUID, nutrition_id: uuid.UUID, db: Session = Depends(get_db)):
    link = db.query(IngredientNutrition).filter(
        IngredientNutrition.ingredient_id == ingredient_id,
        IngredientNutrition.nutrition_id == nutrition_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link between ingredient and nutrition not found")

    db.delete(link)
    db.commit()
    return {"message": "Nutrition detached from ingredient successfully"}
