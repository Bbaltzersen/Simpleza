from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from database.connection import SessionLocal
from models.ingredient import Ingredient
from models.product import Product
from models.ingredient_product import IngredientProduct
from models.density import Density
from models.approximate_measurement import ApproximateMeasurement
from schemas.ingredient import IngredientCreate, IngredientOut
from schemas.approximate_measurement import ApproximateMeasurementCreate, ApproximateMeasurementOut

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    """ Adds a new ingredient and links it to products, density, and measurements. """

    existing_ingredient = db.query(Ingredient).filter(Ingredient.name == ingredient.name).first()
    if existing_ingredient:
        raise HTTPException(status_code=400, detail="Ingredient already exists")

    new_ingredient = Ingredient(
        name=ingredient.name,
        default_unit=ingredient.default_unit,
        calories_per_100g=ingredient.calories_per_100g
    )
    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)

    linked_products = []
    for product_id in ingredient.product_ids:
        product = db.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID '{product_id}' not found.")
        ingredient_product = IngredientProduct(ingredient_id=new_ingredient.ingredient_id, product_id=product.product_id)
        db.add(ingredient_product)
        linked_products.append(product.product_id)

    linked_measurements = []
    for measurement_entry in ingredient.approximate_measurements:
        measurement = ApproximateMeasurement(
            ingredient_id=new_ingredient.ingredient_id,
            measurement_type=measurement_entry.measurement_type,
            value=measurement_entry.value,
            equivalent_in_grams=measurement_entry.equivalent_in_grams
        )
        db.add(measurement)
        db.commit()
        db.refresh(measurement)
        linked_measurements.append(measurement)

    density_value = None
    if ingredient.density:
        new_density = Density(ingredient_id=new_ingredient.ingredient_id, density=ingredient.density)
        db.add(new_density)
        db.commit()
        db.refresh(new_density)
        density_value = new_density.density

    return IngredientOut(
        ingredient_id=new_ingredient.ingredient_id,
        name=new_ingredient.name,
        default_unit=new_ingredient.default_unit,
        calories_per_100g=new_ingredient.calories_per_100g,
        product_ids=linked_products,
        nutritions=[],
        approximate_measurements=linked_measurements,
        density=density_value
    )
