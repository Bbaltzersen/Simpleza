from sqlalchemy import Column, TIMESTAMP, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship
from .base import Base

class RecipeAnalytics(Base):
    __tablename__ = 'recipe_analytics'
    
    recipe_analytics_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="RESTRICT"), nullable=False, unique=True)
    minimum_price = Column(Numeric(10, 2), nullable=False)  # Calculated minimum price to prepare the recipe
    total_calories = Column(Numeric(10, 2))  # Aggregated total calories for the recipe
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationship: links the analytics record to its recipe.
    recipe = relationship("Recipe", backref="analytics")
