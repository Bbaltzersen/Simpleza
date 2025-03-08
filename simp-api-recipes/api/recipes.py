from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict
import uuid

from database.connection import SessionLocal
from models.recipe import Recipe
from models.recipe_author import RecipeAuthor
from models.recipe_favorite import RecipeFavorite
from models.recipe_image import RecipeImage
from models.recipe_ingredient import RecipeIngredient
from models.recipe_step import RecipeStep
from models.tag import Tag
from models.recipe_tag import RecipeTag

router = APIRouter(prefix="", tags=["recipes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


