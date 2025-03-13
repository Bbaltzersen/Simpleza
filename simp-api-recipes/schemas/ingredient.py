from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class IngredientCreate(BaseModel):
    name: str
    description: Optional[str] = None

class IngredientOut(BaseModel):
    ingredient_id: UUID  # Ensure it's a string
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True  # Ensures conversion from SQLAlchemy models
