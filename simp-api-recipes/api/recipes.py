from typing import Dict, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete
from sqlalchemy.orm import Session, joinedload
import uuid
from uuid import UUID
from fuzzywuzzy import process  
from database.auth.authorize import get_current_user
from database.connection import SessionLocal
from models.ingredient import Ingredient
from models.recipe import Recipe
from models.recipe_image import RecipeImage
from models.recipe_ingredient import RecipeIngredient
from models.recipe_step import RecipeStep
from models.recipe_tag import RecipeTag
from models.tag import Tag
from schemas.recipe import  EditRecipe, RecipeOut, CreateRecipe, CreateRecipeIngredient, CreateRecipeImage, CreateRecipeTag

router = APIRouter(tags=["recipes"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=Dict[str, List[RecipeOut] | int])
def read_recipes(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    total_recipes = db.query(Recipe).count()
    recipes = db.query(Recipe).offset(skip).limit(limit).all()

    return {
        "recipes": [
            RecipeOut(
                recipe_id=str(recipe.recipe_id),
                title=recipe.title,
                front_image=recipe.front_image,
                tags=[tag.name for tag in recipe.tags]
            )
            for recipe in recipes
        ],
        "total": total_recipes  
    }

# # API Call to get recipes made by a user.
@router.get("/author-id/{author_id}/", response_model=Dict[str, List[RecipeOut] | int])
def read_user_recipes(
    author_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    total_recipes = db.query(Recipe).filter(Recipe.author_id == author_id).count()
    user_recipes = db.query(Recipe).filter(Recipe.author_id == author_id).offset(skip).limit(limit).all()
    
    return {
        "recipes": [
            RecipeOut(
                recipe_id=str(recipe.recipe_id),
                title=recipe.title,
                front_image=recipe.front_image,
                tags=[tag.name for tag in recipe.tags]
            )
            for recipe in user_recipes
        ],
        "total": total_recipes  
    }

@router.get("/recipe-id/{recipe_id}/", response_model=EditRecipe)
def read_recipe(
    recipe_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.recipe_id == recipe_id).first()
    
    return recipe


@router.post("/", response_model=RecipeOut)
def create_recipe(recipe: CreateRecipe, db: Session = Depends(get_db)):
    try:
        # Create the new Recipe record.
        new_recipe = Recipe(
            recipe_id=uuid.uuid4(),
            title=recipe.title,
            description=recipe.description,
            front_image=recipe.front_image,
            author_id=recipe.author_id,
            validated=False,
        )
        db.add(new_recipe)
        
        # Process tags.
        for tag_input in recipe.tags:
            if tag_input.tag_id:
                tag_obj = db.query(Tag).filter(Tag.tag_id == tag_input.tag_id).first()
                if not tag_obj:
                    raise HTTPException(status_code=400, detail=f"Tag {tag_input.tag_id} not found.")
            else:
                tag_obj = db.query(Tag).filter(Tag.name == tag_input.name).first()
                if not tag_obj:
                    tag_obj = Tag(name=tag_input.name)
                    db.add(tag_obj)
                    db.flush()  # Ensure tag_obj gets an id.
            new_recipe.tags.append(tag_obj)
        
        # Process ingredients.
        for ing_input in recipe.ingredients:
            # Check if ingredient exists by id or by name.
            if ing_input.ingredient_id:
                ingredient_obj = db.query(Ingredient).filter(Ingredient.ingredient_id == ing_input.ingredient_id).first()
                if not ingredient_obj:
                    raise HTTPException(status_code=400, detail=f"Ingredient {ing_input.ingredient_id} not found.")
            else:
                ingredient_obj = db.query(Ingredient).filter(Ingredient.name == ing_input.ingredient_name).first()
                if not ingredient_obj:
                    ingredient_obj = Ingredient(name=ing_input.ingredient_name)
                    db.add(ingredient_obj)
                    db.flush()  # Get its id.
            # Create the association (RecipeIngredient).
            new_recipe_ing = RecipeIngredient(
                recipe_id=new_recipe.recipe_id,
                ingredient_id=ingredient_obj.ingredient_id,
                amount=ing_input.amount,
                measurement=ing_input.measurement,
                position=ing_input.position,
            )
            db.add(new_recipe_ing)
        
        # Process steps.
        for step_input in recipe.steps:
            new_step = RecipeStep(
                recipe_id=new_recipe.recipe_id,
                step_number=step_input.step_number,
                description=step_input.description,
                image_url=step_input.image_url,
            )
            db.add(new_step)
        
        # Process images.
        for image_input in recipe.images:
            new_image = RecipeImage(
                recipe_id=new_recipe.recipe_id,
                image_url=image_input.image_url,
            )
            db.add(new_image)
        
        db.commit()
        db.refresh(new_recipe)  # Refresh to get latest state from DB

        return RecipeOut(
            recipe_id=str(new_recipe.recipe_id),
            title=new_recipe.title,
            front_image=new_recipe.front_image,
            tags=[tag.name for tag in new_recipe.tags]
        )
    except Exception as e:
        db.rollback()
        raise e


@router.put("/update/{recipe_id}/", response_model=RecipeOut)
def update_recipe(
    recipe_id: UUID,
    recipe: CreateRecipe,
    db: Session = Depends(get_db)
):
    try:
        # Retrieve the existing recipe.
        existing_recipe = db.query(Recipe).filter(Recipe.recipe_id == recipe_id).first()
        if not existing_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")

        # Update basic fields.
        existing_recipe.title = recipe.title
        existing_recipe.description = recipe.description
        existing_recipe.front_image = recipe.front_image
        existing_recipe.author_id = recipe.author_id

        # ----- Update Tags -----
        # Clear existing tag associations.
        existing_recipe.tags.clear()
        for tag_input in recipe.tags:
            if tag_input.tag_id:
                tag_obj = db.query(Tag).filter(Tag.tag_id == tag_input.tag_id).first()
                if not tag_obj:
                    raise HTTPException(status_code=400, detail=f"Tag {tag_input.tag_id} not found.")
            else:
                tag_obj = db.query(Tag).filter(Tag.name == tag_input.name).first()
                if not tag_obj:
                    tag_obj = Tag(name=tag_input.name)
                    db.add(tag_obj)
                    db.flush()  # Ensure tag_obj gets an ID.
            existing_recipe.tags.append(tag_obj)

        # ----- Update Ingredients -----
        # Remove current ingredient associations.
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
        for ing_input in recipe.ingredients:
            # Check if the ingredient exists by id or by name.
            if ing_input.ingredient_id:
                ingredient_obj = db.query(Ingredient).filter(
                    Ingredient.ingredient_id == ing_input.ingredient_id
                ).first()
                if not ingredient_obj:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ingredient {ing_input.ingredient_id} not found."
                    )
            else:
                ingredient_obj = db.query(Ingredient).filter(
                    Ingredient.name == ing_input.ingredient_name
                ).first()
                if not ingredient_obj:
                    ingredient_obj = Ingredient(name=ing_input.ingredient_name)
                    db.add(ingredient_obj)
                    db.flush()
            # Create the association record.
            new_recipe_ing = RecipeIngredient(
                recipe_id=existing_recipe.recipe_id,
                ingredient_id=ingredient_obj.ingredient_id,
                amount=ing_input.amount,
                measurement=ing_input.measurement,
                position=ing_input.position,
            )
            db.add(new_recipe_ing)

        # ----- Update Steps -----
        db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe_id).delete()
        for step_input in recipe.steps:
            new_step = RecipeStep(
                recipe_id=existing_recipe.recipe_id,
                step_number=step_input.step_number,
                description=step_input.description,
                image_url=step_input.image_url,
            )
            db.add(new_step)

        # ----- Update Images -----
        db.query(RecipeImage).filter(RecipeImage.recipe_id == recipe_id).delete()
        for image_input in recipe.images:
            new_image = RecipeImage(
                recipe_id=existing_recipe.recipe_id,
                image_url=image_input.image_url,
            )
            db.add(new_image)

        db.commit()
        db.refresh(existing_recipe)

        return RecipeOut(
            recipe_id=str(existing_recipe.recipe_id),
            title=existing_recipe.title,
            front_image=existing_recipe.front_image,
            tags=[tag.name for tag in existing_recipe.tags]
        )
    except Exception as e:
        db.rollback()
        raise e

@router.delete("/delete/{recipe_id}/", response_model=dict)
def delete_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Retrieve the recipe from the database.
    recipe = db.query(Recipe).filter(Recipe.recipe_id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Ensure the logged-in user is the author.
    if str(recipe.author_id) != str(current_user.get("user_id")):
        raise HTTPException(status_code=403, detail="Not authorized to delete this recipe")
    
    # Delete related child records.
    db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.recipe_id).delete(synchronize_session=False)
    db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe.recipe_id).delete(synchronize_session=False)
    db.query(RecipeImage).filter(RecipeImage.recipe_id == recipe.recipe_id).delete(synchronize_session=False)
    # For RecipeTag, which is a Table, use the delete expression.
    db.execute(delete(RecipeTag).where(RecipeTag.c.recipe_id == recipe.recipe_id))
    
    # Delete the recipe itself.
    db.delete(recipe)
    db.commit()
    
    return {"message": "Recipe deleted successfully"}
# @router.get("/get-all/", response_model=List[RecipeOut])
# def get_recipes(db: Session = Depends(get_db)):
#     return db.query(Recipe).all()

# @router.get("/pagination/", response_model=List[RecipeOut])
# def get_pagination(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=20), db: Session = Depends(get_db)):
#     return db.query(Recipe).offset(skip).limit(limit).all()

# @router.get("/", response_model=Dict[str, List[IngredientOut] | int])
# def read_ingredients(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
#     total_ingredients = db.query(Ingredient).count()
#     ingredients = db.query(Ingredient).offset(skip).limit(limit).all()

#     return {
#         "ingredients": ingredients,
#         "total": total_ingredients
#     }


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
