from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

# Import database connection
from database.connection import SessionLocal
# Import models
from models.nutrition import Nutrition
# Import schemas from new schemas folder
from schemas.nutrition import NutritionCreate, NutritionOut

# Initialize the FastAPI router
router = APIRouter(prefix="/nutritions", tags=["Nutritions"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#######################################
#         Nutrition CRUD Routes       #
#######################################

@router.post("/", response_model=NutritionOut, status_code=status.HTTP_201_CREATED)
def create_nutrition(nutrition: NutritionCreate, db: Session = Depends(get_db)):
    """ Adds a new nutrition if it does not already exist. """
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


@router.get("/", response_model=list[NutritionOut])
def read_nutritions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """ Retrieves a list of all nutritions (paginated). """
    nutritions = db.query(Nutrition).offset(skip).limit(limit).all()
    return nutritions


@router.get("/{nutrition_id}", response_model=NutritionOut)
def read_nutrition(nutrition_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Retrieves a specific nutrition by ID. """
    nutrition = db.query(Nutrition).filter(Nutrition.nutrition_id == nutrition_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition not found")
    return nutrition


@router.put("/{nutrition_id}", response_model=NutritionOut)
def update_nutrition(nutrition_id: uuid.UUID, nutrition_update: NutritionCreate, db: Session = Depends(get_db)):
    """ Updates the details of an existing nutrition. """
    nutrition = db.query(Nutrition).filter(Nutrition.nutrition_id == nutrition_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition not found")

    # Update fields
    nutrition.name = nutrition_update.name
    nutrition.measurement = nutrition_update.measurement
    nutrition.recommended = nutrition_update.recommended

    db.commit()
    db.refresh(nutrition)
    return nutrition


@router.delete("/{nutrition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition(nutrition_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Deletes a nutrition by ID. """
    nutrition = db.query(Nutrition).filter(Nutrition.nutrition_id == nutrition_id).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition not found")

    db.delete(nutrition)
    db.commit()
    return None
