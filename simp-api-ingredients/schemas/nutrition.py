from pydantic import BaseModel
import uuid
from typing import Optional

# Request model for creating/updating a nutrition
class NutritionCreate(BaseModel):
    name: str
    measurement: str
    recommended: Optional[float] = None  # Recommended daily intake

# Response model for returning nutrition data
class NutritionOut(BaseModel):
    nutrition_id: uuid.UUID
    name: str
    measurement: str
    recommended: Optional[float] = None

    class Config:
        from_attributes = True
