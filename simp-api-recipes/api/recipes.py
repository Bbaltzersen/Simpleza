from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
import uuid
from uuid import UUID
from fuzzywuzzy import process  
from database.connection import SessionLocal
from models.recipe import Recipe
from models.recipe_image import RecipeImage
from models.recipe_ingredient import RecipeIngredient
from models.recipe_step import RecipeStep
from models.tag import Tag
from models.recipe_tag import RecipeTag
from models.ingredient import Ingredient  
from schemas.ingredient import IngredientOut
from schemas.recipe import RecipeImageSchema, RecipeIngredientSchema, RecipeOut, RecipeCreateSchema, RecipeRetrieveSchema, RecipeStepSchema, TagOut

router = APIRouter(tags=["recipes"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.get("/get-all/", response_model=List[RecipeOut])
def get_recipes(db: Session = Depends(get_db)):
    return db.query(Recipe).all()

@router.get("/pagination/", response_model=List[RecipeOut])
def get_pagination(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=20), db: Session = Depends(get_db)):
    return db.query(Recipe).offset(skip).limit(limit).all()

# @router.get("/", response_model=Dict[str, List[IngredientOut] | int])
# def read_ingredients(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
#     total_ingredients = db.query(Ingredient).count()
#     ingredients = db.query(Ingredient).offset(skip).limit(limit).all()

#     return {
#         "ingredients": ingredients,
#         "total": total_ingredients
#     }

@router.get("/", response_model=Dict[str, List[RecipeOut] | int])
def read_recipes(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    total_recipes = db.query(Recipe).count()
    user_recipes = db.query(Recipe).offset(skip).limit(limit).all()
    
    return {
        "recipes": user_recipes,
        "total": total_recipes
    }

# # API Call to get recipes made by a user.
@router.get("/{author_id}/", response_model=Dict[str, List[RecipeOut] | int])
def read_user_recipes(author_id: uuid.UUID, skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=20), db: Session = Depends(get_db)):
    total_recipes = db.query(Recipe).filter(Recipe.author_id == author_id).count()
    user_recipes = db.query(Recipe).filter(Recipe.author_id == author_id).offset(skip).limit(limit).all()
    
    return {
        "total": total_recipes,
        "recipes": user_recipes 
    }




# @router.post("/", response_model=RecipeOut)
# def create_recipe(recipe_data: RecipeCreateSchema, db: Session = Depends(get_db)):
#     new_recipe = Recipe(
#         recipe_id=uuid.uuid4(),
#         title=recipe_data.title,
#         description=recipe_data.description
#     )
#     db.add(new_recipe)
#     db.flush()  # Generate recipe_id without committing

#     # Get all existing ingredient names and IDs from the database
#     ingredient_dict = {ing.name.lower(): ing.ingredient_id for ing in db.query(Ingredient).all()}

#     # Ingredient handling
#     for ingredient in recipe_data.ingredients:
#         ingredient_name = ingredient.ingredient_name # Assume frontend sends names instead of UUIDs
        
#         existing_ingredient_id = ingredient_dict.get(ingredient_name)

#         if not existing_ingredient_id:
#             # Find the closest match in the database
#             closest_match, similarity = process.extractOne(ingredient_name, ingredient_dict.keys()) if ingredient_dict else (None, 0)

#             if similarity and similarity > 80:  # ✅ Acceptable similarity threshold
#                 existing_ingredient_id = ingredient_dict[closest_match]
#             else:
#                 raise HTTPException(status_code=400, detail=f"Ingredient '{ingredient_name}' not found. Please verify.")

#         recipe_ingredient = RecipeIngredient(
#             recipe_id=new_recipe.recipe_id,
#             ingredient_id=existing_ingredient_id,
#             amount=ingredient.amount,
#             measurement=ingredient.measurement
#         )
#         db.add(recipe_ingredient)

#     # Add steps
#     recipe_steps = [
#         RecipeStep(
#             recipe_id=new_recipe.recipe_id,
#             step_number=step.step_number,
#             description=step.description,
#             image_url=step.image_url
#         )
#         for step in recipe_data.steps
#     ]
#     db.add_all(recipe_steps)

#     # Add images
#     recipe_images = [
#         RecipeImage(
#             recipe_id=new_recipe.recipe_id,
#             image_url=image.image_url
#         )
#         for image in recipe_data.images
#     ]
#     db.add_all(recipe_images)

#     # Add tags (Ensuring tags exist)
#     for tag_id in recipe_data.tags:
#         existing_tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
#         if not existing_tag:
#             raise HTTPException(status_code=400, detail=f"Tag '{tag_id}' does not exist")
#         recipe_tag = RecipeTag(recipe_id=new_recipe.recipe_id, tag_id=tag_id)
#         db.add(recipe_tag)

#     db.commit()
#     db.refresh(new_recipe)

#     return new_recipe

# @router.get("/{recipe_id}", response_model=RecipeRetrieveSchema)
# def get_recipe_with_details(recipe_id: str, db: Session = Depends(get_db)):
#     recipe = (
#         db.query(Recipe)
#         .filter(Recipe.recipe_id == recipe_id)
#         .options(
#             joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
#             joinedload(Recipe.steps),
#             joinedload(Recipe.images),
#             joinedload(Recipe.tags),
#         )
#         .first()
#     )

#     if not recipe:
#         raise HTTPException(status_code=404, detail="Recipe not found")

#     return RecipeRetrieveSchema(
#         title=recipe.title,
#         description=recipe.description,
#         author_id=recipe.author_id,
#         ingredients=[
#             RecipeIngredientSchema(
#                 ingredient_id=ing.ingredient_id,
#                 ingredient_name=ing.ingredient.name,  # Get ingredient name
#                 amount=ing.amount,
#                 measurement=ing.measurement
#             )
#             for ing in recipe.ingredients
#         ],
#         steps=[
#             RecipeStepSchema(
#                 step_number=step.step_number,
#                 description=step.description,
#                 image_url=step.image_url
#             )
#             for step in recipe.steps
#         ],
#         images=[
#             RecipeImageSchema(image_url=image.image_url)
#             for image in recipe.images
#         ],
#         tags=[
#             TagOut(tag_id=tag.tag.tag_id, name=tag.tag.name)
#             for tag in recipe.tags
#         ]
#     )
