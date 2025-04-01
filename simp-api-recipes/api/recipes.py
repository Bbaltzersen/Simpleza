from typing import Dict, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import case, and_
import uuid
from uuid import UUID
from fuzzywuzzy import process  
from database.auth.authorize import get_current_user
from database.connection import SessionLocal
from models.database_tables import Cauldron, Ingredient, Recipe, RecipeIngredient, RecipeStep, RecipeImage, RecipeTag, Tag
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
def read_recipes(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total_recipes = db.query(Recipe).count()
    recipes = db.query(Recipe).offset(skip).limit(limit).all()

    return {
        "recipes": [
            RecipeOut(
                recipe_id=str(recipe.recipe_id),
                title=recipe.title,
                front_image=recipe.front_image,
                tags=[tag.name for tag in recipe.tags],
                in_cauldron=False  # No cauldron context here
            )
            for recipe in recipes
        ],
        "total": total_recipes  
    }

@router.get("/author-id/{author_id}/", response_model=Dict[str, List[RecipeOut] | int])
def read_user_recipes(
    author_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    total_recipes = db.query(Recipe).filter(Recipe.author_id == author_id).count()
    
    # Use an alias for Cauldron
    cauldron_alias = aliased(Cauldron)
    
    # Pass the tuple directly instead of a list.
    in_cauldron_case = case(
        (cauldron_alias.recipe_id != None, True),
        else_=False
    ).label("in_cauldron")
    
    recipes_query = (
        db.query(Recipe, in_cauldron_case)
        .outerjoin(
            cauldron_alias,
            and_(
                Recipe.recipe_id == cauldron_alias.recipe_id,
                cauldron_alias.user_id == author_id,
                cauldron_alias.is_active == True
            )
        )
        .filter(Recipe.author_id == author_id)
        .offset(skip)
        .limit(limit)
    )
    
    results = recipes_query.all()
    
    # results is a list of tuples: (Recipe, in_cauldron)
    recipes_out = [
        RecipeOut(
            recipe_id=str(recipe.recipe_id),
            title=recipe.title,
            front_image=recipe.front_image,
            tags=[tag.name for tag in recipe.tags],
            in_cauldron=in_cauldron
        )
        for recipe, in_cauldron in results
    ]
    
    return {
        "recipes": recipes_out,
        "total": total_recipes
    }

@router.get("/recipe-id/{recipe_id}/", response_model=EditRecipe)
def read_recipe(
    recipe_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.recipe_id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@router.post("/", response_model=RecipeOut)
def create_recipe(recipe: CreateRecipe, db: Session = Depends(get_db)):
    try:
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
            # Search by name if no valid ingredient_id provided.
            ingredient_obj = db.query(Ingredient).filter(Ingredient.name.ilike(ing_input.ingredient_name)).first()
            if not ingredient_obj:
                ingredient_obj = Ingredient(name=ing_input.ingredient_name)
                db.add(ingredient_obj)
                db.flush()  # Ensure ingredient_obj gets an id.
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
            # Skip insertion if image_url is empty (or whitespace)
            if not image_input.image_url or not image_input.image_url.strip():
                continue
            new_image = RecipeImage(
                recipe_id=new_recipe.recipe_id,
                image_url=image_input.image_url,
            )
            db.add(new_image)
        
        db.commit()
        db.refresh(new_recipe)

        return RecipeOut(
            recipe_id=str(new_recipe.recipe_id),
            title=new_recipe.title,
            front_image=new_recipe.front_image,
            tags=[tag.name for tag in new_recipe.tags],
            in_cauldron=False  # New recipe not in cauldron by default.
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
        existing_recipe = db.query(Recipe).filter(Recipe.recipe_id == recipe_id).first()
        if not existing_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")

        existing_recipe.title = recipe.title
        existing_recipe.description = recipe.description
        existing_recipe.front_image = recipe.front_image
        existing_recipe.author_id = recipe.author_id

        # Update Tags.
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
                    db.flush()
            existing_recipe.tags.append(tag_obj)

        # Update Ingredients.
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
        for ing_input in recipe.ingredients:
            if ing_input.ingredient_id:
                ingredient_obj = db.query(Ingredient).filter(Ingredient.ingredient_id == ing_input.ingredient_id).first()
                if not ingredient_obj:
                    raise HTTPException(status_code=400, detail=f"Ingredient {ing_input.ingredient_id} not found.")
            else:
                ingredient_obj = db.query(Ingredient).filter(Ingredient.name == ing_input.ingredient_name).first()
                if not ingredient_obj:
                    ingredient_obj = Ingredient(name=ing_input.ingredient_name)
                    db.add(ingredient_obj)
                    db.flush()
            new_recipe_ing = RecipeIngredient(
                recipe_id=existing_recipe.recipe_id,
                ingredient_id=ingredient_obj.ingredient_id,
                amount=ing_input.amount,
                measurement=ing_input.measurement,
                position=ing_input.position,
            )
            db.add(new_recipe_ing)

        # Update Steps.
        db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe_id).delete()
        for step_input in recipe.steps:
            new_step = RecipeStep(
                recipe_id=existing_recipe.recipe_id,
                step_number=step_input.step_number,
                description=step_input.description,
                image_url=step_input.image_url,
            )
            db.add(new_step)

        # Update Images.
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
            tags=[tag.name for tag in existing_recipe.tags],
            in_cauldron=False  # Default value; update if needed.
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
    recipe = db.query(Recipe).filter(Recipe.recipe_id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    if str(recipe.author_id) != str(current_user.get("user_id")):
        raise HTTPException(status_code=403, detail="Not authorized to delete this recipe")
    
    db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.recipe_id).delete(synchronize_session=False)
    db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe.recipe_id).delete(synchronize_session=False)
    db.query(RecipeImage).filter(RecipeImage.recipe_id == recipe.recipe_id).delete(synchronize_session=False)
    db.execute(delete(RecipeTag).where(RecipeTag.c.recipe_id == recipe.recipe_id))
    
    db.delete(recipe)
    db.commit()
    
    return {"message": "Recipe deleted successfully"}