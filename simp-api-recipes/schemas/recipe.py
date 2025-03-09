from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class RecipeOut(BaseModel):
    recipe_id: UUID
    title: str

    class Config:
        from_attributes = True


class RecipeIngredientSchema(BaseModel):
    ingredient_id: UUID
    amount: float
    measurement: str

class RecipeStepSchema(BaseModel):
    step_number: int
    description: str
    image_url: Optional[str] = None

class RecipeImageSchema(BaseModel):
    image_url: str

class RecipeCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[RecipeIngredientSchema]
    steps: List[RecipeStepSchema]
    images: List[RecipeImageSchema]
    tags: List[str]

    class Config:
        from_attributes = True


class TagOut(BaseModel):
    tag_id: UUID
    name: str

    class Config:
        from_attributes = True