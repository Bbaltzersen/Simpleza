from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import uuid
import uuid as UUID

from database.connection import SessionLocal
from models.recipe import Recipe
from models.recipe_image import RecipeImage
from models.recipe_ingredient import RecipeIngredient
from models.recipe_step import RecipeStep
from models.tag import Tag
from models.recipe_tag import RecipeTag
from schemas.recipe import RecipeOut, RetrieveTag

router = APIRouter(tags=["tags"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[RetrieveTag])
def search_tag(
    search: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Search tags with full-text search, similarity, and ILIKE fallback."""

    if not search:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    query_tsquery = func.plainto_tsquery("english", search)

    query = db.query(Tag)

    if len(search) > 2:
        query = query.filter(
            Tag.name_tsv.op("@@")(query_tsquery) |
            (func.similarity(Tag.name, search) >= 0.8)
        ).order_by(
            func.ts_rank_cd(Tag.name_tsv, query_tsquery).desc(),
            func.similarity(Tag.name, search).desc()
        )
    else:
        query = query.filter(Tag.name.ilike(f"%{search}%"))  # ✅ Fallback for short words

    return query.limit(10).all()


# @router.post("/{tag_name}")
# def create_tag(tag_name: str, db: Session = Depends(get_db)):
#     new_tag = Tag(
#         tag_id=uuid.uuid4(),
#         name=tag_name
#     )
#     db.add(new_tag)
#     db.commit()
#     db.refresh(new_tag)

#     return new_tag

# @router.get("/")
# def get_tags(db: Session = Depends(get_db)):
#     tags = db.query(Tag).all()
#     return [{"tag_id": str(tag.tag_id), "name": tag.name} for tag in tags]  # Convert UUID to string
