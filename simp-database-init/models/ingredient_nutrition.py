from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class IngredientNutrition(Base):
    __tablename__ = "ingredient_nutrition"

    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), primary_key=True)
    nutrition_id = Column(UUID(as_uuid=True), ForeignKey("nutrition.nutrition_id", ondelete="CASCADE"), primary_key=True)
