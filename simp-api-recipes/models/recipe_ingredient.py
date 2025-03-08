from sqlalchemy import Column, ForeignKey, Numeric, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), primary_key=True)
    amount = Column(Numeric(10, 2), nullable=False)
    measurement = Column(TEXT, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
