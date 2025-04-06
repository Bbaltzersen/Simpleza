# models/recipe_author.py

from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class RecipeAuthor(Base):
    __tablename__ = "recipe_authors"

    recipe_id = Column(
        UUID(as_uuid=True),
        ForeignKey("recipes.recipe_id", ondelete="CASCADE"),
        primary_key=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True
    )
    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )
