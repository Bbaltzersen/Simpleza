# schemas/ingredient.py

import uuid
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List # Added List for potential future use
from decimal import Decimal # Numeric fields map to Decimal

# --- Base Schema ---
# Defines the core properties of an ingredient.
class IngredientBase(BaseModel):
    name: str = Field(
        ..., # Ellipsis means this field is required
        min_length=1,
        examples=["Raw Apple with Skin", "Whole Wheat Flour", "Chicken Breast"],
        description="Primary display name of the ingredient."
    )
    description: Optional[str] = Field(
        default=None,
        examples=["A common variety of apple, consumed raw.", "Flour milled from the entire wheat kernel."],
        description="Optional description providing more context about the ingredient."
    )
    # Use Decimal for precise numeric fields corresponding to SQLAlchemy Numeric
    density_g_per_ml: Optional[Decimal] = Field(
        default=None,
        gt=0, # Density should ideally be greater than 0
        examples=[Decimal("0.95")], # Use Decimal in examples too
        description="Optional: Density in grams per milliliter, used for volume conversions."
    )
    default_unit: str = Field(
        # Although the model has a default, require it in create for clarity,
        # or keep default="g" here if preferred. Let's require it.
        ...,
        max_length=10,
        examples=["g", "ml", "piece", "cup"],
        description="Default unit expected when using this ingredient (e.g., in recipes)."
    )
    diet_level: int = Field(
        default=4, # Default as per model
        ge=1, # Assuming 1 is the lowest level (e.g., Vegan)
        le=4, # Assuming 4 is the highest level (e.g., Omnivore)
        examples=[1, 2, 3, 4],
        description="Diet classification (e.g., 1=Vegan, 2=Vegetarian, 3=Pescatarian, 4=Omnivore)."
    )
    validated: bool = Field(
        default=False, # Default as per model
        description="Indicates if the ingredient information has been validated/approved by an admin."
    )
    # Note: Fields like name_tsv are database-internal and not included in API schemas.
    # Note: FKs like food_group_id could be added if those relationships are implemented.

# --- Create Schema ---
# Defines the data needed to create a new ingredient via POST.
class IngredientCreate(IngredientBase):
    # Inherits all fields from IngredientBase.
    # Pydantic enforces required fields (name, default_unit).
    # Optional fields can be provided.
    # Default values for diet_level, validated, etc., are handled.
    pass # No extra fields needed for basic create

# --- Update Schema ---
# Defines the data that *can* be provided to update an existing ingredient via PUT/PATCH.
# All fields are optional to allow partial updates.
class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, examples=["Raw Apple with Skin (Fuji)"])
    description: Optional[str] = Field(default=None)
    density_g_per_ml: Optional[Decimal] = Field(default=None, gt=0) # Allow updating/setting density
    default_unit: Optional[str] = Field(default=None, max_length=10)
    diet_level: Optional[int] = Field(default=None, ge=1, le=4) # Allow changing diet level
    validated: Optional[bool] = Field(default=None) # Allow changing validation status

# --- Output Schema ---
# Defines the data structure returned FROM the API when retrieving ingredients.
# Includes the database-generated ID.
class IngredientOut(IngredientBase):
    ingredient_id: uuid.UUID

    # Pydantic V2 configuration for ORM mode
    model_config = ConfigDict(
        from_attributes=True
    )

    # # Pydantic V1 Config
    # class Config:
    #     orm_mode = True

# --- Potentially Needed Later ---
# You will likely need schemas for IngredientAlias and IngredientNutrient as well
# to handle adding/editing/viewing those related pieces of data. Example:

# from .nutrient import NutrientOut # Assuming you have NutrientOut

# class IngredientAliasOut(BaseModel):
#     alias_id: uuid.UUID
#     alias_name: str
#     alias_type: Optional[str]
#     language_code: Optional[str]
#     model_config = ConfigDict(from_attributes=True)

# class IngredientNutrientValue(BaseModel):
#     # Simplified - might include nutrient name/unit directly or nested NutrientOut
#     nutrient_id: uuid.UUID
#     nutrient_name: str # Denormalized for convenience?
#     value: Decimal
#     unit: str # Denormalized for convenience?
#     # value_basis: str # Usually 'per 100g'
#     # validated: bool

# class IngredientOutWithDetails(IngredientOut):
#      aliases: List[IngredientAliasOut] = []
#      nutrient_values: List[IngredientNutrientValue] = [] # Simplified example