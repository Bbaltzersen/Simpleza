from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class RecipeOut(BaseModel):
    recipe_id: UUID
    title: str
    front_image: str
    tags: List[str]
    in_cauldron: bool = False

    class Config:
        from_attributes = True

class CreateRecipeIngredient(BaseModel):
    ingredient_name: str
    amount: float
    measurement: str
    position: int

    class Config:
        from_attributes = True

class CreateRecipeStep(BaseModel):
    step_number: int
    description: str
    image_url: Optional[str] = None  # Now accepts null

    class Config:
        from_attributes = True

class CreateRecipeImage(BaseModel):
    image_url: str

    class Config:
        from_attributes = True

class CreateRecipeTag(BaseModel):
    tag_id: Optional[UUID] = None
    name: str

    class Config:
        from_attributes = True

class CreateRecipe(BaseModel):
    title: str
    description: str
    front_image: str
    author_id: UUID
    ingredients: List[CreateRecipeIngredient]
    steps: List[CreateRecipeStep] 
    images: List[CreateRecipeImage]
    tags: List[CreateRecipeTag]

    class Config:
        from_attributes = True

class EditRecipe(BaseModel):
    recipe_id: UUID
    title: str
    description: str
    front_image: str
    author_id: UUID
    ingredients: List[CreateRecipeIngredient]
    steps: List[CreateRecipeStep] 
    images: List[CreateRecipeImage]
    tags: List[CreateRecipeTag]

    class Config:
        from_attributes = True



class RetrieveTag(BaseModel):
    tag_id: UUID
    name: str

    class Config: 
        from_attributes = True


# class RecipeIngredientSchema(BaseModel):
#     ingredient_id: UUID
#     ingredient_name: str
#     amount: float
#     measurement: str

#     class Config:
#         from_attributes = True

# class RecipeStepSchema(BaseModel):
#     step_number: int
#     description: str
#     image_url: Optional[str] = None

#     class Config:
#         from_attributes = True
    

# class RecipeImageSchema(BaseModel):
#     image_url: str

#     class Config:
#         from_attributes = True

# class RecipeCreateSchema(BaseModel):
#     title: str
#     description: Optional[str] = None
#     author_id: Optional[UUID] = None
#     ingredients: List[RecipeIngredientSchema]
#     steps: List[RecipeStepSchema]
#     images: List[RecipeImageSchema]
#     tags: List[UUID]

#     class Config:
#         from_attributes = True

# class TagOut(BaseModel):
#     tag_id: UUID
#     name: str

#     class Config:
#         from_attributes = True

# class RecipeRetrieveSchema(BaseModel):
#     title: str
#     description: Optional[str] = None
#     author_id: Optional[UUID] = None
#     ingredients: List[RecipeIngredientSchema]
#     steps: List[RecipeStepSchema]
#     images: List[RecipeImageSchema]
#     tags: List[TagOut]

