from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class RecipeTag(Base):
    __tablename__ = "recipe_tags"

    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.tag_id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
