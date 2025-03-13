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
