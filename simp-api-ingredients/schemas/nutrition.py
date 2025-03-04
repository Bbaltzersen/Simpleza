from pydantic import BaseModel
import uuid
from typing import Optional

class NutritionCreate(BaseModel):
    name: str
    measurement: str
    recommended: Optional[float] = None  # Recommended daily intake

class NutritionOut(BaseModel):
    nutrition_id: uuid.UUID
    name: str
    measurement: str
    recommended: Optional[float] = None

    class Config:
        from_attributes = True
