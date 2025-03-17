from decimal import Decimal
from pydantic import BaseModel, Field
import uuid
from typing import List, Optional

from schemas.approximate_measurement import ApproximateMeasurementOut
from schemas.approximate_measurement import ApproximateMeasurementCreate

class IngredientCreate(BaseModel):
    name: str
    default_unit: str = "g"
    calories_per_100g: Optional[float] = None
    validated: bool = False  # ✅ Ensure default value
    diet_level: int = 4       # ✅ Default to 4 (Omnivore)

    class Config:
        from_attributes = True  # ✅ Ensures Pydantic can map from ORM models

# Response model for returning ingredient data
class IngredientOut(BaseModel):
    ingredient_id: uuid.UUID
    name: str
    default_unit: str
    calories_per_100g: Optional[float]
    product_ids: List[uuid.UUID] = []
    nutritions: List[str] = []
    validated: bool
    diet_level: int  # ✅ Ensure diet_level is included in responses
    approximate_measurements: List[ApproximateMeasurementOut] = []  # ✅ Correct schema usage
    density: Optional[float] = None

    class Config:
        from_attributes = True  # ✅ Allows Pydantic to work with SQLAlchemy models

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    default_unit: Optional[str] = None
    calories_per_100g: Optional[Decimal] = Field(None, max_digits=10, decimal_places=2)
    validated: Optional[bool] = None
    diet_level: Optional[int] = None  # ✅ Allows diet_level to be updated

    class Config:
        from_attributes = True

class NutritionLink(BaseModel):
    nutrition_id: uuid.UUID
    ingredient_id: uuid.UUID
