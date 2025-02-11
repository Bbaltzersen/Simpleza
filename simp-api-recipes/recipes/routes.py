# # recipes/routes.py
# import uuid
# from typing import List, Optional

# from fastapi import APIRouter, Depends, HTTPException, Request, status
# from pydantic import BaseModel
# from sqlalchemy.orm import Session

# from config import RATE_LIMIT, limiter
# from database import get_db
# from models.recipe import Recipe as RecipeModel

# router = APIRouter(prefix="/recipes")

# class RecipeBase(BaseModel):
#     title: str
#     description: Optional[str] = None

#     class Config:
#         from_attributes = True  

# class RecipeCreate(RecipeBase):
#     pass

# class RecipeUpdate(BaseModel):
#     title: Optional[str] = None
#     description: Optional[str] = None

# class RecipeResponse(RecipeBase):
#     recipe_id: uuid.UUID
#     author_id: Optional[uuid.UUID] = None
#     created_at: str

#     class Config:
#         from_attributes = True  

# # ----------------- CRUD Endpoints -----------------

# @router.get("/", response_model=List[RecipeResponse])
# @limiter.limit(RATE_LIMIT)
# async def list_recipes(request: Request, db: Session = Depends(get_db)):
#     """Retrieve a list of recipes from the database."""
#     recipes = db.query(RecipeModel).all()
#     return recipes

# @router.get("/{recipe_id}", response_model=RecipeResponse)
# @limiter.limit(RATE_LIMIT)
# async def get_recipe(request: Request, recipe_id: uuid.UUID, db: Session = Depends(get_db)):
#     """Retrieve a single recipe by its ID."""
#     recipe = db.query(RecipeModel).filter(RecipeModel.recipe_id == recipe_id).first()
#     if not recipe:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
#     return recipe

# @router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
# @limiter.limit(RATE_LIMIT)
# async def create_recipe(request: Request, recipe: RecipeCreate, db: Session = Depends(get_db)):
#     """Create a new recipe in the database."""
#     new_recipe = RecipeModel(
#         title=recipe.title,
#         description=recipe.description
#         # Optionally, set the author_id if available from your authentication logic.
#     )
#     db.add(new_recipe)
#     db.commit()
#     db.refresh(new_recipe)
#     return new_recipe

# @router.put("/{recipe_id}", response_model=RecipeResponse)
# @limiter.limit(RATE_LIMIT)
# async def update_recipe(
#     request: Request,
#     recipe_id: uuid.UUID,
#     recipe_update: RecipeUpdate,
#     db: Session = Depends(get_db)
# ):
#     """Update an existing recipe in the database."""
#     recipe_db = db.query(RecipeModel).filter(RecipeModel.recipe_id == recipe_id).first()
#     if not recipe_db:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    
#     if recipe_update.title is not None:
#         recipe_db.title = recipe_update.title
#     if recipe_update.description is not None:
#         recipe_db.description = recipe_update.description
    
#     db.commit()
#     db.refresh(recipe_db)
#     return recipe_db

# @router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
# @limiter.limit(RATE_LIMIT)
# async def delete_recipe(request: Request, recipe_id: uuid.UUID, db: Session = Depends(get_db)):
#     """Delete a recipe from the database."""
#     recipe_db = db.query(RecipeModel).filter(RecipeModel.recipe_id == recipe_id).first()
#     if not recipe_db:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
#     db.delete(recipe_db)
#     db.commit()
#     return
