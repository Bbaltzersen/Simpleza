from decimal import Decimal
from pydantic import BaseModel, Field
import uuid
from typing import List, Optional

from sqlalchemy import Boolean
from schemas.approximate_measurement import ApproximateMeasurementOut
from schemas.approximate_measurement import ApproximateMeasurementCreate

# Request model for creating/updating an ingredient
class IngredientCreate(BaseModel):
    name: str
    default_unit: str = "g"
    calories_per_100g: Optional[float] = None
    validated: bool

# Response model for returning ingredient data
class IngredientOut(BaseModel):
    ingredient_id: uuid.UUID
    name: str
    default_unit: str
    calories_per_100g: Optional[float]
    product_ids: List[uuid.UUID] = []
    nutritions: List[str] = []
    validated: bool
    approximate_measurements: List[ApproximateMeasurementOut] = []  # Now using schema
    density: Optional[float] = None

    class Config:
        from_attributes = True

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    default_unit: Optional[str] = None
    calories_per_100g: Optional[Decimal] = Field(None, max_digits=10, decimal_places=2)


class NutritionLink(BaseModel):
    nutrition_id: uuid.UUID
    ingredient_id: uuid.UUID