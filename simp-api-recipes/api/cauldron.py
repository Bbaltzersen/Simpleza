from typing import Any, Dict, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import uuid

from database.connection import SessionLocal
from schemas.cauldron import CauldronCreate, CauldronSchema, CauldronUpdate
from models.database_tables import Cauldron as CauldronModel  # SQLAlchemy model for Cauldron
from models.database_tables import Recipe

router = APIRouter(tags=["cauldrons"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=CauldronSchema)
def create_cauldron(cauldron_create: CauldronCreate, db: Session = Depends(get_db)):
    """
    Create a new cauldron entry to add a recipe to the user's cauldron.
    """
    # Optionally verify the recipe exists or check for duplicates here.
    new_cauldron = CauldronModel(
        user_id=cauldron_create.user_id,
        recipe_id=cauldron_create.recipe_id,
        is_active=cauldron_create.is_active,
    )
    db.add(new_cauldron)
    db.commit()
    db.refresh(new_cauldron)
    return new_cauldron

@router.delete("/{cauldron_id}", response_model=Dict[str, str])
def delete_cauldron(cauldron_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a cauldron entry, effectively removing the recipe from the user's cauldron.
    """
    cauldron_obj = (
        db.query(CauldronModel)
        .filter(CauldronModel.cauldron_id == cauldron_id)
        .first()
    )
    if not cauldron_obj:
        raise HTTPException(status_code=404, detail="Cauldron not found")
    
    db.delete(cauldron_obj)
    db.commit()
    return {"detail": "Cauldron deleted successfully"}

@router.put("/{cauldron_id}", response_model=CauldronSchema)
def update_cauldron(
    cauldron_id: uuid.UUID,
    cauldron_update: CauldronUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a cauldron entry. For example, you might change the is_active flag.
    """
    cauldron_obj = (
        db.query(CauldronModel)
        .filter(CauldronModel.cauldron_id == cauldron_id)
        .first()
    )
    if not cauldron_obj:
        raise HTTPException(status_code=404, detail="Cauldron not found")
    
    update_data = cauldron_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cauldron_obj, key, value)
    
    db.commit()
    db.refresh(cauldron_obj)
    return cauldron_obj

@router.get("/user/{user_id}", response_model=Dict[str, Union[List[CauldronSchema], int]])
def read_cauldrons_by_user(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated cauldron entries for a user.
    """
    total_cauldrons = (
        db.query(CauldronModel)
        .filter(CauldronModel.user_id == user_id)
        .count()
    )

    cauldrons = (
        db.query(CauldronModel)
        .filter(CauldronModel.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "cauldrons": cauldrons,
        "total": total_cauldrons,
    }

@router.get("/recipes", response_model=Dict[str, Any])
def read_cauldron_recipes(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve cauldron recipes (i.e. recipes added to the cauldron) for a given user.
    This endpoint joins the cauldron entries with their corresponding recipe data.
    """
    total = (
        db.query(func.count(CauldronModel.cauldron_id))
        .filter(CauldronModel.user_id == user_id)
        .scalar()
    )

    results = (
        db.query(CauldronModel, Recipe)
        .join(Recipe, CauldronModel.recipe_id == Recipe.recipe_id)
        .filter(CauldronModel.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    cauldron_recipes = []
    for cauldron, recipe in results:
        cauldron_recipes.append({
            "cauldron_id": str(cauldron.cauldron_id),
            "user_id": str(cauldron.user_id),
            "recipe_id": str(cauldron.recipe_id),
            "is_active": cauldron.is_active,
            "created_at": cauldron.created_at.isoformat(),
            "updated_at": cauldron.updated_at.isoformat(),
            "title": recipe.title,
            "tags": [tag.name for tag in recipe.tags],
            "front_image": recipe.front_image,
        })

    return {
        "cauldron_recipes": cauldron_recipes,
        "total_cauldron_recipes": total,
    }

@router.delete("/user/{user_id}/recipe/{recipe_id}", response_model=Dict[str, str])
def delete_cauldron_by_user_and_recipe(
    user_id: uuid.UUID,
    recipe_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a cauldron entry for a specific user and recipe.
    """
    cauldron_obj = (
        db.query(CauldronModel)
        .filter(
            CauldronModel.user_id == user_id,
            CauldronModel.recipe_id == recipe_id
        )
        .first()
    )
    if not cauldron_obj:
        raise HTTPException(
            status_code=404,
            detail="Cauldron entry not found for the given user and recipe"
        )
    db.delete(cauldron_obj)
    db.commit()
    return {"detail": "Cauldron entry deleted successfully"}
