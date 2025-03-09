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

router = APIRouter(tags=["tags"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/tag/{tag_name}")
def create_tag(tag_name: str, db: Session = Depends(get_db)):
    new_tag = Tag(
        tag_id=UUID(),
        name=tag_name
    )
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)

    return new_tag

@router.get("/tags", response_model=List[TagOut])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).all()
    return tags