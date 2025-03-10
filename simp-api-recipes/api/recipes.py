from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from uuid import UUID

from database.connection import SessionLocal
from models.recipe import Recipe
from models.recipe_image import RecipeImage
from models.recipe_ingredient import RecipeIngredient
from models.recipe_step import RecipeStep
from models.tag import Tag
from models.recipe_tag import RecipeTag
from schemas.recipe import RecipeOut, RecipeCreateSchema, TagOut

router = APIRouter(tags=["recipes"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[RecipeOut])
def get_recipes(db: Session = Depends(get_db)):
    recipes = db.query(Recipe).all()
    return recipes

@router.post("/", response_model=RecipeOut)
def create_recipe(recipe_data: RecipeCreateSchema, db: Session = Depends(get_db)):
    # Create a new recipe
    new_recipe = Recipe(
        recipe_id=uuid.uuid4(),
        title=recipe_data.title,
        description=recipe_data.description
    )
    db.add(new_recipe)
    db.flush()  # Flush to generate recipe_id without committing

    # Add ingredients (Ensuring ingredient exists)
    for ingredient in recipe_data.ingredients:
        ingredient_uuid = UUID(ingredient.ingredient_id)
        recipe_ingredient = RecipeIngredient(
            recipe_id=new_recipe.recipe_id,
            ingredient_id=ingredient_uuid,
            amount=ingredient.amount,
            measurement=ingredient.measurement
        )
        db.add(recipe_ingredient)

    # Add steps
    recipe_steps = [
        RecipeStep(
            recipe_id=new_recipe.recipe_id,
            step_number=step.step_number,
            description=step.description,
            image_url=step.image_url
        )
        for step in recipe_data.steps
    ]
    db.add_all(recipe_steps)

    # Add images
    recipe_images = [
        RecipeImage(
            recipe_id=new_recipe.recipe_id,
            image_url=image.image_url
        )
        for image in recipe_data.images
    ]
    db.add_all(recipe_images)

    # Add tags (Ensuring tags exist)
    for tag_name in recipe_data.tags:
        tag_uuid = UUID(tag_name)
        existing_tag = db.query(Tag).filter(Tag.tag_id == tag_uuid).first()
        if not existing_tag:
            raise HTTPException(status_code=400, detail=f"Tag '{tag_name}' does not exist")

        recipe_tag = RecipeTag(
            recipe_id=new_recipe.recipe_id,
            tag_id=tag_uuid
        )
        db.add(recipe_tag)

    db.commit()
    db.refresh(new_recipe)  # Refresh to get updated relationships

    return new_recipe
