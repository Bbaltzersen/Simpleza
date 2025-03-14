import uuid
from sqlalchemy import UUID, Column, String
from sqlalchemy.orm import relationship
from .base import Base
from .recipe_tag import RecipeTag  # ✅ Import the association table

class Tag(Base):
    __tablename__ = "tags"

    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)

    # ✅ Correct many-to-many relationship
    recipes = relationship("Recipe", secondary=RecipeTag, back_populates="tags")
