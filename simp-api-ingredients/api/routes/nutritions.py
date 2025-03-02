from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict
import uuid

from database.connection import SessionLocal
from models.nutrition import Nutrition
from schemas.nutrition import NutritionCreate, NutritionOut

router = APIRouter(prefix="", tags=["Nutritions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=NutritionOut, status_code=status.HTTP_201_CREATED)
def create_nutrition(nutrition: NutritionCreate, db: Session = Depends(get_db)):
    existing_nutrition = db.query(Nutrition).filter(Nutrition.name == nutrition.name).first()
    if existing_nutrition:
        raise HTTPException(status_code=400, detail="Nutrition already exists")

    new_nutrition = Nutrition(
        name=nutrition.name,
        measurement=nutrition.measurement,
        recommended=nutrition.recommended
    )
    db.add(new_nutrition)
    db.commit()
    db.refresh(new_nutrition)
    return new_nutrition

@router.get("/", response_model=Dict[str, List[NutritionOut] | int])
def read_nutritions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total_nutritions = db.query(Nutrition).count()
    nutritions = db.query(Nutrition).offset(skip).limit(limit).all()

    return {
        "nutritions": nutritions,
        "total": total_nutritions
    }

@router.get("/{nutrition_id}", response_model=NutritionOut)
def read_nutrition(nutrition_id: uuid.UUID, db: Session = Depends(get_db)):
    nutrition = db.query(Nutrition).filter(Nutrition.nutrition_id == nutrition_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition not found")
    return nutrition

@router.put("/{nutrition_id}", response_model=NutritionOut)
def update_nutrition(nutrition_id: uuid.UUID, nutrition_update: NutritionCreate, db: Session = Depends(get_db)):
    nutrition = db.query(Nutrition).filter(Nutrition.nutrition_id == nutrition_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition not found")

    nutrition.name = nutrition_update.name
    nutrition.measurement = nutrition_update.measurement
    nutrition.recommended = nutrition_update.recommended

    db.commit()
    db.refresh(nutrition)
    return nutrition

@router.delete("/{nutrition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition(nutrition_id: uuid.UUID, db: Session = Depends(get_db)):
    nutrition = db.query(Nutrition).filter(Nutrition.nutrition_id == nutrition_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition not found")

    db.delete(nutrition)
    db.commit()
    return None
