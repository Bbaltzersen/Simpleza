from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from uuid import UUID
from fuzzywuzzy import process  # ✅ For fuzzy string matching
from database.connection import SessionLocal
from models.recipe import Recipe
from models.recipe_image import RecipeImage
from models.recipe_ingredient import RecipeIngredient
from models.recipe_step import RecipeStep
from models.tag import Tag
from models.recipe_tag import RecipeTag
from models.ingredient import Ingredient  # ✅ Ensure you have an Ingredient model
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
    return db.query(Recipe).all()

@router.post("/", response_model=RecipeOut)
def create_recipe(recipe_data: RecipeCreateSchema, db: Session = Depends(get_db)):
    new_recipe = Recipe(
        recipe_id=uuid.uuid4(),
        title=recipe_data.title,
        description=recipe_data.description
    )
    db.add(new_recipe)
    db.flush()  # Generate recipe_id without committing

    # Get all existing ingredient names and IDs from the database
    ingredient_dict = {ing.name.lower(): ing.ingredient_id for ing in db.query(Ingredient).all()}

    # Ingredient handling
    for ingredient in recipe_data.ingredients:
        ingredient_name = ingredient.ingredient_name # Assume frontend sends names instead of UUIDs
        
        existing_ingredient_id = ingredient_dict.get(ingredient_name)

        if not existing_ingredient_id:
            # Find the closest match in the database
            closest_match, similarity = process.extractOne(ingredient_name, ingredient_dict.keys()) if ingredient_dict else (None, 0)

            if similarity and similarity > 80:  # ✅ Acceptable similarity threshold
                existing_ingredient_id = ingredient_dict[closest_match]
            else:
                raise HTTPException(status_code=400, detail=f"Ingredient '{ingredient_name}' not found. Please verify.")

        recipe_ingredient = RecipeIngredient(
            recipe_id=new_recipe.recipe_id,
            ingredient_id=existing_ingredient_id,
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
    for tag_id in recipe_data.tags:
        existing_tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
        if not existing_tag:
            raise HTTPException(status_code=400, detail=f"Tag '{tag_id}' does not exist")
        recipe_tag = RecipeTag(recipe_id=new_recipe.recipe_id, tag_id=tag_id)
        db.add(recipe_tag)

    db.commit()
    db.refresh(new_recipe)

    return new_recipe
