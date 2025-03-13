from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base

class RecipeTag(Base):
    __tablename__ = "recipe_tags"

    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.tag_id"), primary_key=True)  # ❌ No Cascade Delete
    created_at = Column(TIMESTAMP, server_default=func.now())

    recipe = relationship("Recipe", back_populates="tags")
    tags = relationship("tags")

