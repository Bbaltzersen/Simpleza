from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import uuid
from decimal import Decimal, InvalidOperation # Import Decimal

from database.connection import SessionLocal
from models.database_tables import Nutrient # Use Nutrient model
# Import corrected schemas including NutritionUpdate
from schemas.nutrition import NutritionCreate, NutritionOut, NutritionUpdate

router = APIRouter(prefix="", tags=["Nutritions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=NutritionOut, status_code=status.HTTP_201_CREATED)
def create_nutrition(nutrition_data: NutritionCreate, db: Session = Depends(get_db)):
    existing_nutrition = db.query(Nutrient).filter(Nutrient.name == nutrition_data.name).first()
    if existing_nutrition:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nutrition name already exists")

    # Map fields from NutritionCreate to Nutrient model, handle potential Decimals
    nutrition_dict = nutrition_data.model_dump(exclude_unset=True)
    if 'eu_reference_intake_value' in nutrition_dict and nutrition_dict['eu_reference_intake_value'] is not None:
         try:
            nutrition_dict['eu_reference_intake_value'] = Decimal(nutrition_dict['eu_reference_intake_value'])
         except InvalidOperation:
             raise HTTPException(status_code=422, detail="Invalid decimal value for EU reference intake")

    new_nutrition = Nutrient(**nutrition_dict) # Unpack validated data

    db.add(new_nutrition)
    try:
        db.commit()
        db.refresh(new_nutrition)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    return NutritionOut.model_validate(new_nutrition) # Validate output

@router.get("/", response_model=Dict[str, List[NutritionOut] | int])
def read_nutritions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total_nutritions = db.query(Nutrient).count()
    nutritions_db = db.query(Nutrient).offset(skip).limit(limit).all()

    return {
        "nutritions": [NutritionOut.model_validate(n) for n in nutritions_db], # Validate output
        "total": total_nutritions
    }

@router.get("/by-name/{nutrition_name}", response_model=NutritionOut) # Use specific path for name lookup
def get_nutrition_by_name(nutrition_name: str, db: Session = Depends(get_db)):
    # Consider case-insensitive search if appropriate for your DB/use case
    nutrition = db.query(Nutrient).filter(Nutrient.name == nutrition_name).first()
    if not nutrition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutrition not found by name")
    return NutritionOut.model_validate(nutrition) # Validate output

@router.get("/{nutrient_id}", response_model=NutritionOut) # Use nutrient_id to match model
def read_nutrition(nutrient_id: uuid.UUID, db: Session = Depends(get_db)): # Use nutrient_id
    nutrition = db.query(Nutrient).filter(Nutrient.nutrient_id == nutrient_id).first() # Use nutrient_id
    if not nutrition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutrition not found")
    return NutritionOut.model_validate(nutrition) # Validate output

@router.put("/{nutrient_id}", response_model=NutritionOut) # Use nutrient_id
def update_nutrition(nutrient_id: uuid.UUID, nutrition_update: NutritionUpdate, db: Session = Depends(get_db)): # Use NutritionUpdate schema
    nutrition = db.query(Nutrient).filter(Nutrient.nutrient_id == nutrient_id).first() # Use nutrient_id
    if not nutrition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutrition not found")

    update_data = nutrition_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        # Handle potential Decimal conversion for relevant fields if they exist in NutritionUpdate
        if key == 'eu_reference_intake_value' and value is not None:
             try:
                 value = Decimal(value)
             except InvalidOperation:
                  raise HTTPException(status_code=422, detail="Invalid decimal value for EU reference intake")

        if hasattr(nutrition, key):
             setattr(nutrition, key, value)
        else:
             # Optional: Log or raise warning for unexpected keys
             print(f"Warning: Attribute '{key}' not found on Nutrient model during update.")


    try:
        db.commit()
        db.refresh(nutrition)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    return NutritionOut.model_validate(nutrition) # Validate output

@router.delete("/{nutrient_id}", status_code=status.HTTP_204_NO_CONTENT) # Use nutrient_id
def delete_nutrition(nutrient_id: uuid.UUID, db: Session = Depends(get_db)): # Use nutrient_id
    nutrition = db.query(Nutrient).filter(Nutrient.nutrient_id == nutrient_id).first() # Use nutrient_id
    if not nutrition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutrition not found")

    db.delete(nutrition)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    return None

# Removed the /retrieve/{nutrition_name} endpoint as /by-name/{nutrition_name} replaces it