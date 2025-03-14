from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class IngredientCreate(BaseModel):
    name: str

class IngredientOut(BaseModel):
    ingredient_id: UUID  # Ensure it's a string
    name: str

    class Config:
        from_attributes = True  # Ensures conversion from SQLAlchemy models

class IngredientSchema(BaseModel):
    ingredient_id: UUID
    name: str
    default_unit: str
    calories_per_100g: float | None = None  # Optional field

    class Config:
        from_attributes = True  # ✅ Allows conversion from SQLAlchemy models