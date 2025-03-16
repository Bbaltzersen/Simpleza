from sqlalchemy import Column, ForeignKey, Integer, Numeric, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, TEXT
from sqlalchemy.orm import relationship
from .base import Base
from .ingredient import Ingredient

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id"), primary_key=True)  # ❌ No Cascade Delete
    amount = Column(Numeric(10, 2), nullable=False)
    measurement = Column(TEXT, nullable=False)
    position = Column(Integer, nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")
