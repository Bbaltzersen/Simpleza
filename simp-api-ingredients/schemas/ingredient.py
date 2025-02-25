from pydantic import BaseModel
import uuid
from typing import List, Optional
from schemas.approximate_measurement import ApproximateMeasurementOut
from schemas.approximate_measurement import ApproximateMeasurementCreate

# Request model for creating/updating an ingredient
class IngredientCreate(BaseModel):
    name: str
    default_unit: str = "g"
    calories_per_100g: Optional[float] = None
    product_ids: Optional[List[uuid.UUID]] = []  # List of product IDs
    nutrition_names: Optional[List[str]] = []  # List of nutrition names
    approximate_measurements: Optional[List[ApproximateMeasurementCreate]] = []  # List of measurement mappings
    density: Optional[float] = None  # Density in g/ml

# Response model for returning ingredient data
class IngredientOut(BaseModel):
    ingredient_id: uuid.UUID
    name: str
    default_unit: str
    calories_per_100g: Optional[float]
    product_ids: List[uuid.UUID] = []
    nutritions: List[str] = []
    approximate_measurements: List[ApproximateMeasurementOut] = []  # Now using schema
    density: Optional[float] = None

    class Config:
        orm_mode = True
