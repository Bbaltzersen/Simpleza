# routes/ingredient.py (or similar file location)

import uuid
from decimal import Decimal
from typing import List, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload # Import loading strategies
from sqlalchemy import func, select, update, insert

# Import database session dependency
from database.connection import SessionLocal # Adjust path if needed

# Import models
from models.ingredient import Ingredient
from models.ingredient_nutrient import IngredientNutrient
from models.nutrient import Nutrient
# Import schemas
from schemas.ingredient import (
    IngredientCreate, IngredientUpdate, IngredientOut, PaginatedIngredients,
    IngredientNutrientLink, IngredientNutrientOut, BatchNutrientUpdateRequest
)

# Define router
router = APIRouter(
    prefix="",
    tags=["Ingredients"]
)

# Dependency function (keep as defined before)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === Core Ingredient CRUD ===

@router.post("/", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(ingredient_in: IngredientCreate, db: Session = Depends(get_db)):
    """
    Create a new ingredient. Checks for name conflict (case-insensitive).
    """
    existing = db.query(Ingredient).filter(
        func.lower(Ingredient.name) == ingredient_in.name.lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ingredient name '{ingredient_in.name}' already exists."
        )

    # Create model instance from schema data (Pydantic v2)
    # Enums from schema will be correctly passed to the model
    new_ingredient = Ingredient(**ingredient_in.model_dump())

    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)
    return new_ingredient # FastAPI handles conversion using IngredientOut

@router.get("/", response_model=PaginatedIngredients) # Use PaginatedIngredients schema
def read_ingredients(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=200, description="Maximum number of records"),
    sort_by: Optional[str] = Query("name", description="Field to sort by (e.g., name, default_unit, diet_level)"),
    sort_order: Optional[str] = Query("asc", description="Sort order: 'asc' or 'desc'"),
    validated: Optional[bool] = Query(None, description="Filter by validation status"),
    db: Session = Depends(get_db)
):
    """
    Retrieve a paginated list of ingredients with optional filtering and sorting.
    """
    query = db.query(Ingredient)

    # Filtering
    if validated is not None:
        query = query.filter(Ingredient.validated == validated)

    total_items = query.count() # Count before sorting/pagination for accuracy

    # Sorting
    order_column = getattr(Ingredient, sort_by, Ingredient.name) # Default to name
    if order_column: # Check if attribute exists
        if sort_order.lower() == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())

    # Pagination
    ingredients = query.offset(skip).limit(limit).all()

    return {
        "items": ingredients,
        "total": total_items,
        "skip": skip,
        "limit": limit,
        # Optional: Calculate total_pages if needed
        # "total_pages": (total_items + limit - 1) // limit
    }

@router.get("/{ingredient_id}", response_model=IngredientOut)
def read_ingredient(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve a specific ingredient by its ID.
    """
    db_ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with ID {ingredient_id} not found"
        )
    return db_ingredient # FastAPI handles conversion

@router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(
    ingredient_id: uuid.UUID,
    ingredient_update: IngredientUpdate, # Use update schema
    db: Session = Depends(get_db)
):
    """
    Update an ingredient by its ID. Allows partial updates.
    Checks for name conflicts if the name is being changed.
    """
    db_ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with ID {ingredient_id} not found"
        )

    # Get fields that were actually sent in the request body
    update_data = ingredient_update.model_dump(exclude_unset=True)

    if not update_data:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided."
        )

    # Check for name conflict if name is being updated to a new value
    if "name" in update_data and update_data["name"].lower() != db_ingredient.name.lower():
        existing = db.query(Ingredient).filter(
            func.lower(Ingredient.name) == update_data["name"].lower(),
            Ingredient.ingredient_id != ingredient_id # Don't conflict with self
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ingredient name '{update_data['name']}' already exists."
            )

    # Update model instance with provided data
    for key, value in update_data.items():
        setattr(db_ingredient, key, value)

    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient # FastAPI handles conversion

# --- Ingredient Nutrient Linking ---

def _get_ingredient_or_404(ingredient_id: uuid.UUID, db: Session) -> Ingredient:
    """Helper to fetch ingredient or raise 404."""
    db_ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with ID {ingredient_id} not found"
        )
    return db_ingredient

@router.get("/{ingredient_id}/nutrients", response_model=List[IngredientNutrientOut])
def get_ingredient_nutrient_links(ingredient_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve all nutrient values associated with a specific ingredient,
    including nutrient name and unit (manual construction).
    """
    _get_ingredient_or_404(ingredient_id, db) # Helper defined previously

    # Query IngredientNutrient and eagerly load the related Nutrient
    # This query REQUIRES the IngredientNutrient model (with nutrient_value)
    nutrient_links = db.query(IngredientNutrient).filter(
        IngredientNutrient.ingredient_id == ingredient_id
    ).options(
        joinedload(IngredientNutrient.nutrient) # Load Nutrient details
    ).all()

    # --- Manual Construction Loop (Alternative to @property) ---
    response_data = []
    for link in nutrient_links:
        # Start with data directly from the IngredientNutrient link table object
        response_item_data = {
            "ingredient_nutrient_id": link.ingredient_nutrient_id,
            "ingredient_id": link.ingredient_id,
            "nutrient_id": link.nutrient_id,
            "nutrient_value": link.nutrient_value,
            "value_basis": link.value_basis,
            "validated": link.validated,
            "nutrient_name": None, # Default to None
            "unit": None           # Default to None
        }
        # If the related Nutrient object was loaded, add its details
        if link.nutrient:
            response_item_data["nutrient_name"] = link.nutrient.nutrient_name
            # Access unit directly as string (based on previous error)
            response_item_data["unit"] = link.nutrient.unit if link.nutrient.unit else None

        # Validate the constructed dictionary against the Pydantic schema
        response_item = IngredientNutrientOut.model_validate(response_item_data)
        response_data.append(response_item)
    # --- End Manual Construction Loop ---

    return response_data


@router.put("/{ingredient_id}/nutrients", response_model=List[IngredientNutrientOut])
def batch_update_ingredient_nutrient_links(
    ingredient_id: uuid.UUID,
    nutrient_links_in: BatchNutrientUpdateRequest, # Expects List[IngredientNutrientLink]
    db: Session = Depends(get_db)
):
    """
    Batch create or update nutrient values for a specific ingredient.
    Only affects nutrients included in the request body.
    Existing nutrient links not included in the request are NOT deleted.
    """
    # Ensure ingredient exists
    _get_ingredient_or_404(ingredient_id, db)

    if not nutrient_links_in:
        # Return current list if input is empty? Or raise error? Or return empty list?
        # Let's return empty list for idempotency of empty update.
        return []

    updated_or_created_ids = set()
    results = []

    # Fetch existing links for this ingredient in one go
    existing_links_query = db.query(IngredientNutrient).filter(
        IngredientNutrient.ingredient_id == ingredient_id,
        IngredientNutrient.nutrient_id.in_([link.nutrient_id for link in nutrient_links_in])
    )
    existing_links_map = {link.nutrient_id: link for link in existing_links_query.all()}

    # Process updates and collect new inserts
    new_inserts_data = []
    for link_in in nutrient_links_in:
        existing_link = existing_links_map.get(link_in.nutrient_id)

        if existing_link:
            # Update existing link
            needs_update = False
            if existing_link.nutrient_value != link_in.nutrient_value:
                existing_link.nutrient_value = link_in.nutrient_value
                needs_update = True
            # Add checks/updates for other fields like 'validated' if added to IngredientNutrientLink schema
            # if link_in.validated is not None and existing_link.validated != link_in.validated:
            #     existing_link.validated = link_in.validated
            #     needs_update = True

            if needs_update:
                db.add(existing_link) # Add to session if modified (SQLAlchemy tracks changes)
            results.append(existing_link) # Add for potential refresh/response
            updated_or_created_ids.add(existing_link.ingredient_nutrient_id)
        else:
            # Prepare data for new link insertion
             new_inserts_data.append({
                "ingredient_id": ingredient_id,
                "nutrient_id": link_in.nutrient_id,
                "nutrient_value": link_in.nutrient_value,
                # Add 'validated' or other defaults if necessary/part of schema
                # "validated": link_in.validated if link_in.validated is not None else False,
             })

    # Perform bulk insert if any new links
    if new_inserts_data:
        # For PostgreSQL, can use insert().returning() to get IDs efficiently
        # Using basic add_all for broader compatibility or simplicity
        new_link_objects = [IngredientNutrient(**data) for data in new_inserts_data]
        db.add_all(new_link_objects)
        results.extend(new_link_objects) # Add new objects to results

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        # Log the error e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during batch update.")

    # Refresh objects to get updated state and load relationships for response
    final_results = []
    refreshed_ids = set()
    for res in results:
        if res.ingredient_nutrient_id not in refreshed_ids: # Avoid duplicate refresh if updated then added to results
             try:
                 db.refresh(res)
                 # Eagerly load nutrient for response model population
                 db.refresh(res.nutrient) if hasattr(res, 'nutrient') and res.nutrient else None
                 # Manually construct response item like in the GET endpoint
                 response_item = IngredientNutrientOut.model_validate(res)
                 if res.nutrient:
                     response_item.nutrient_name = res.nutrient.nutrient_name
                     response_item.unit = str(res.nutrient.unit.value) if res.nutrient.unit else None
                 final_results.append(response_item)
                 refreshed_ids.add(res.ingredient_nutrient_id)
             except Exception as refresh_error:
                 # Handle cases where an object might have been deleted concurrently or other issues
                 print(f"Could not refresh object {res.ingredient_nutrient_id}: {refresh_error}")
                 # Decide whether to skip this item or raise an error

    # Alternative: Re-query all affected items after commit for response
    # final_results = db.query(IngredientNutrient).options(selectinload(IngredientNutrient.nutrient)).filter(
    #      IngredientNutrient.ingredient_id == ingredient_id,
    #      IngredientNutrient.nutrient_id.in_([link.nutrient_id for link in nutrient_links_in])
    # ).all()
    # return final_results # Directly return if schema can handle conversion

    return final_results # Return manually constructed list