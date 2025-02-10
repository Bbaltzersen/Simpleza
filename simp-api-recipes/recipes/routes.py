from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from authentication.auth import get_current_user
from config import RATE_LIMIT, limiter

router = APIRouter(prefix="/recipes")

# ----------------- Recipe Models -----------------

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[str] = []
    instructions: Optional[str] = None

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(RecipeBase):
    pass

class Recipe(RecipeBase):
    id: int

# A dummy in-memory "database" for demonstration purposes.
recipes_db = {}

# ----------------- Recipe CRUD Endpoints -----------------

@router.get("/", response_model=List[Recipe])
@limiter.limit(RATE_LIMIT)
async def list_recipes(request: Request, user: dict = Depends(get_current_user)):
    """Retrieve a list of recipes."""
    return list(recipes_db.values())

@router.get("/{recipe_id}", response_model=Recipe)
@limiter.limit(RATE_LIMIT)
async def get_recipe(request: Request, recipe_id: int, user: dict = Depends(get_current_user)):
    """Retrieve a single recipe by its ID."""
    recipe = recipes_db.get(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@router.post("/", response_model=Recipe, status_code=201)
@limiter.limit(RATE_LIMIT)
async def create_recipe(request: Request, recipe: RecipeCreate, user: dict = Depends(get_current_user)):
    """Create a new recipe."""
    recipe_id = max(recipes_db.keys(), default=0) + 1
    new_recipe = Recipe(id=recipe_id, **recipe.dict())
    recipes_db[recipe_id] = new_recipe
    return new_recipe

@router.put("/{recipe_id}", response_model=Recipe)
@limiter.limit(RATE_LIMIT)
async def update_recipe(request: Request, recipe_id: int, recipe: RecipeUpdate, user: dict = Depends(get_current_user)):
    """Update an existing recipe."""
    stored_recipe = recipes_db.get(recipe_id)
    if not stored_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    updated_recipe = stored_recipe.copy(update=recipe.dict())
    recipes_db[recipe_id] = updated_recipe
    return updated_recipe

@router.delete("/{recipe_id}", status_code=204)
@limiter.limit(RATE_LIMIT)
async def delete_recipe(request: Request, recipe_id: int, user: dict = Depends(get_current_user)):
    """Delete a recipe."""
    if recipe_id not in recipes_db:
        raise HTTPException(status_code=404, detail="Recipe not found")
    del recipes_db[recipe_id]
    return
