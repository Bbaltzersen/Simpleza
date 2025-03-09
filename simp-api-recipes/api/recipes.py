from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid as UUID

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
        recipe_id=UUID(),
        title=recipe_data.title,
        description=recipe_data.description
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)

    # Add ingredients
    for ingredient in recipe_data.ingredients:
        recipe_ingredient = RecipeIngredient(
            recipe_id=new_recipe.recipe_id,
            ingredient_id=ingredient.ingredient_id,
            amount=ingredient.amount,
            measurement=ingredient.measurement
        )
        db.add(recipe_ingredient)

    # Add steps
    for step in recipe_data.steps:
        recipe_step = RecipeStep(
            recipe_id=new_recipe.recipe_id,
            step_number=step.step_number,
            description=step.description,
            image_url=step.image_url
        )
        db.add(recipe_step)

    # Add images
    for image in recipe_data.images:
        recipe_image = RecipeImage(
            recipe_id=new_recipe.recipe_id,
            image_url=image.image_url
        )
        db.add(recipe_image)

    # Add tags
    for tag_name in recipe_data.tags:
        # Find tag by name
        existing_tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not existing_tag:
            # Create new tag if not found
            new_tag = Tag(tag_id=UUID(), name=tag_name)
            db.add(new_tag)
            db.commit()
            db.refresh(new_tag)
            tag_id = new_tag.tag_id
        else:
            tag_id = existing_tag.tag_id

        # Link recipe to tag
        recipe_tag = RecipeTag(
            recipe_id=new_recipe.recipe_id,
            tag_id=tag_id
        )
        db.add(recipe_tag)

    db.commit()

    return new_recipe

