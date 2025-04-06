# schemas/ingredient.py

import uuid
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from decimal import Decimal
from datetime import datetime # Needed for IngredientOut

# Import your Enums (Ensure this path is correct)
from models.enums import UnitNameEnum, DietLevelEnum

# --- Base Schema ---
# Defines the core properties of an ingredient. NOW USING ENUMS.
class IngredientBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        examples=["Raw Apple with Skin", "Whole Wheat Flour", "Chicken Breast"],
        description="Primary display name of the ingredient."
    )
    description: Optional[str] = Field(
        default=None,
        examples=["A common variety of apple, consumed raw.", "Flour milled from the entire wheat kernel."],
        description="Optional description providing more context."
    )
    density_g_per_ml: Optional[Decimal] = Field(
        default=None,
        gt=0,
        examples=[Decimal("0.95")],
        description="Optional: Density in grams per milliliter."
    )
    # Use the Enum type for default_unit
    default_unit: UnitNameEnum = Field(
        # Default set here matches the SQLAlchemy model's default
        default=UnitNameEnum.GRAM,
        examples=[UnitNameEnum.GRAM, UnitNameEnum.MILLILITER],
        description="Default unit expected when using this ingredient."
    )
    # Use the Enum type for diet_level
    diet_level: DietLevelEnum = Field(
        default=DietLevelEnum.OMNIVORE, # Default matches model
        examples=[DietLevelEnum.VEGAN, DietLevelEnum.OMNIVORE],
        description="Diet classification."
    )
    validated: bool = Field(
        default=False,
        description="Admin validation status."
    )

# --- Create Schema ---
class IngredientCreate(IngredientBase):
    # Inherits fields and validation from IngredientBase.
    # Required fields are name. Defaults handle others if not provided.
    pass

# --- Update Schema ---
# All fields optional for partial updates. USES ENUMS.
class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = Field(default=None)
    density_g_per_ml: Optional[Decimal] = Field(default=None, gt=0)
    default_unit: Optional[UnitNameEnum] = Field(default=None) # Optional Enum
    diet_level: Optional[DietLevelEnum] = Field(default=None) # Optional Enum
    validated: Optional[bool] = Field(default=None)

# --- Output Schema ---
# Includes ID and timestamps. USES ENUMS.
class IngredientOut(IngredientBase):
    ingredient_id: uuid.UUID
    # Timestamps added from model
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Schemas for Ingredient Nutrient Linking ---

# Schema for an item in the batch update request list
class IngredientNutrientLink(BaseModel):
    nutrient_id: uuid.UUID = Field(description="The ID of the nutrient.")
    nutrient_value: Decimal = Field(ge=0, description="The value of the nutrient (non-negative).")
    # Suggestion: Add if batch update should also set validation status
    # validated: Optional[bool] = Field(default=None, description="Set validation status for this nutrient link.")

# Schema for the response of getting existing values (includes nutrient details)
class IngredientNutrientOut(BaseModel):
    ingredient_nutrient_id: uuid.UUID # PK of the link table
    ingredient_id: uuid.UUID
    nutrient_id: uuid.UUID
    nutrient_value: Decimal
    value_basis: str # e.g., 'per 100g'
    validated: bool
    # Populated via join in backend to provide context
    nutrient_name: Optional[str] = Field(None, description="Name of the linked nutrient.")
    unit: Optional[str] = Field(None, description="Unit of the linked nutrient.") # Consider using UnitNameEnum here if backend converts

    model_config = ConfigDict(from_attributes=True)

# Input for the batch update endpoint
BatchNutrientUpdateRequest = List[IngredientNutrientLink]

# --- Schemas for Ingredient Aliases (Suggestion: Uncomment and define fully later) ---

class IngredientAliasBase(BaseModel):
    alias_name: str = Field(..., min_length=1)
    # Consider AliasTypeEnum if defined
    alias_type: Optional[str] = Field(default=None, max_length=50)
    language_code: Optional[str] = Field(default=None, max_length=10)

class IngredientAliasCreate(IngredientAliasBase):
     # ingredient_id usually comes from URL path param in POST /ingredients/{id}/aliases
     pass

class IngredientAliasOut(IngredientAliasBase):
    alias_id: uuid.UUID
    ingredient_id: uuid.UUID # Often useful to include FK in output

    model_config = ConfigDict(from_attributes=True)


# --- Schema for Paginated Ingredient Response (Suggestion: Finalize if needed) ---

class PaginatedIngredients(BaseModel):
    items: List[IngredientOut]
    total: int
    skip: int
    limit: int
    # Optional: Add total_pages if calculated in backend
    # total_pages: Optional[int] = None

# --- Schema for Ingredient Output including details (Suggestion: Define when needed) ---

# class IngredientOutWithDetails(IngredientOut):
#      aliases: List[IngredientAliasOut] = []
#      nutrient_values: List[IngredientNutrientOut] = [] # Use the detailed Nutrient Out schema