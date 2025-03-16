from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, TEXT
from sqlalchemy.orm import relationship
from .base import Base
from .recipe_tag import RecipeTag  # ✅ Import the association table
import uuid

class Recipe(Base):
    __tablename__ = "recipes"

    recipe_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(TEXT, nullable=False)
    description = Column(TEXT)
    front_image = Column(TEXT, nullable=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    steps = relationship("RecipeStep", back_populates="recipe", cascade="all, delete-orphan")
    images = relationship("RecipeImage", back_populates="recipe", cascade="all, delete-orphan")
    ingredients = relationship("RecipeIngredient", back_populates="recipe")

    # ✅ Correct many-to-many relationship
    tags = relationship("Tag", secondary=RecipeTag, back_populates="recipes")
