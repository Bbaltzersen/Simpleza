# routes/nutrient.py (or similar file location)

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func # Needed for potential case-insensitive query
from typing import List, Dict, Optional # Keep Dict for pagination response
import uuid

# Assuming database connection setup is in a 'database' directory
from database.connection import SessionLocal
# Import the correct model and schemas
from models.nutrient import Nutrient # Correct model
from schemas.nutrient import NutrientCreate, NutrientUpdate, NutrientOut # Correct schemas

# Define the router with a prefix and descriptive tag
router = APIRouter(
    prefix="", # Added prefix for better organization
    tags=["Nutrients"]   # Updated tag name
)

# Dependency function to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=NutrientOut, status_code=status.HTTP_201_CREATED)
def create_nutrient(nutrient_in: NutrientCreate, db: Session = Depends(get_db)):
    """
    Create a new nutrient definition.
    Checks for existing nutrient with the same name.
    """
    # Check for uniqueness on name (case-insensitive recommended)
    existing_nutrient_name = db.query(Nutrient).filter(
        func.lower(Nutrient.nutrient_name) == nutrient_in.nutrient_name.lower()
    ).first()
    if existing_nutrient_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nutrient name '{nutrient_in.nutrient_name}' already exists."
        )

    # Check for uniqueness on symbol if provided
    if nutrient_in.nutrient_symbol:
        existing_nutrient_symbol = db.query(Nutrient).filter(
            Nutrient.nutrient_symbol == nutrient_in.nutrient_symbol
        ).first()
        if existing_nutrient_symbol:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nutrient symbol '{nutrient_in.nutrient_symbol}' already exists."
            )

    # Create new Nutrient object using data from the input schema
    # Pydantic V2: nutrient_in.model_dump()
    # Pydantic V1: nutrient_in.dict()
    new_nutrient = Nutrient(**nutrient_in.model_dump())

    db.add(new_nutrient)
    db.commit()
    db.refresh(new_nutrient)
    return new_nutrient

@router.get("/", response_model=Dict[str, List[NutrientOut] | int])
def read_nutrients(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(10, ge=1, le=200, description="Maximum number of records to return"), # Increased limit slightly
    sort_by: Optional[str] = Query("nutrient_name", description="Field to sort by (e.g., nutrient_name, unit, primary_group)"),
    sort_order: Optional[str] = Query("asc", description="Sort order: 'asc' or 'desc'"),
    db: Session = Depends(get_db)
):
    """
    Retrieve a paginated list of nutrients.
    """
    query = db.query(Nutrient)
    total_nutrients = query.count()

    # Basic Sorting Logic
    order_column = getattr(Nutrient, sort_by, Nutrient.nutrient_name) # Default sort by name
    if sort_order.lower() == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())

    nutrients = query.offset(skip).limit(limit).all()

    return {
        "items": nutrients, # Renamed 'nutrients' to 'items' for clarity
        "total": total_nutrients,
        "skip": skip,
        "limit": limit
    }

@router.get("/{nutrient_id}", response_model=NutrientOut)
def read_nutrient(nutrient_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve a specific nutrient by its ID.
    """
    db_nutrient = db.query(Nutrient).filter(Nutrient.nutrient_id == nutrient_id).first()
    if not db_nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrient with ID {nutrient_id} not found"
        )
    return db_nutrient

@router.put("/{nutrient_id}", response_model=NutrientOut)
def update_nutrient(
    nutrient_id: uuid.UUID,
    nutrient_update: NutrientUpdate, # Use the NutrientUpdate schema
    db: Session = Depends(get_db)
):
    """
    Update an existing nutrient. Allows partial updates (like PATCH).
    Checks for uniqueness conflicts if name or symbol are changed.
    """
    db_nutrient = db.query(Nutrient).filter(Nutrient.nutrient_id == nutrient_id).first()
    if not db_nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutrient with ID {nutrient_id} not found"
        )

    # Get updated data, excluding fields not provided in the request
    # Pydantic V2: nutrient_update.model_dump(exclude_unset=True)
    # Pydantic V1: nutrient_update.dict(exclude_unset=True)
    update_data = nutrient_update.model_dump(exclude_unset=True)

    if not update_data:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided."
        )

    # Check for potential uniqueness conflicts if name/symbol are being changed
    if "nutrient_name" in update_data and update_data["nutrient_name"].lower() != db_nutrient.nutrient_name.lower():
        existing = db.query(Nutrient).filter(
            func.lower(Nutrient.nutrient_name) == update_data["nutrient_name"].lower(),
            Nutrient.nutrient_id != nutrient_id # Exclude self
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nutrient name '{update_data['nutrient_name']}' already exists."
            )

    if "nutrient_symbol" in update_data and update_data["nutrient_symbol"] is not None and update_data["nutrient_symbol"] != db_nutrient.nutrient_symbol:
        existing = db.query(Nutrient).filter(
            Nutrient.nutrient_symbol == update_data["nutrient_symbol"],
            Nutrient.nutrient_id != nutrient_id # Exclude self
        ).first()
        if existing:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nutrient symbol '{update_data['nutrient_symbol']}' already exists."
             )

    # Update the model fields dynamically
    for key, value in update_data.items():
        setattr(db_nutrient, key, value)

    db.commit()
    db.refresh(db_nutrient)
    return db_nutrient

# DELETE endpoint removed as requested

# @router.get("/lookup/by-name/{nutrient_name}", response_model=NutrientOut)
# def get_nutrient_by_name(nutrient_name: str, db: Session = Depends(get_db)):
#     """
#     Retrieve a specific nutrient by its name (case-insensitive).
#     """
#     # Using case-insensitive comparison (adjust func.lower if needed for other DBs)
#     db_nutrient = db.query(Nutrient).filter(
#         func.lower(Nutrient.nutrient_name) == nutrient_name.lower()
#     ).first()

#     # Or using ILIKE for PostgreSQL:
#     # db_nutrient = db.query(Nutrient).filter(Nutrient.nutrient_name.ilike(nutrient_name)).first()

#     if not db_nutrient:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Nutrient with name '{nutrient_name}' not found"
#         )
#     return db_nutrient