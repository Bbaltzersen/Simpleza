# schemas/ingredient.py
from pydantic import BaseModel, Field
import uuid
from decimal import Decimal
from typing import Optional
# Assuming enum is importable
from models.database_tables import MeasurementUnitEnum

# Input schema for creating ingredients
class IngredientCreate(BaseModel):
    name: str
    default_unit: MeasurementUnitEnum
    calories_per_100g: Optional[float | Decimal] = None
    density_g_ml: Optional[float | Decimal] = None
    validated: Optional[bool] = False # Default validated to False
    diet_level: Optional[int] = 4 # Default diet_level

    class Config:
        from_attributes = True
        use_enum_values = True

# Input schema for updating ingredients (partial updates)
class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    default_unit: Optional[MeasurementUnitEnum] = None
    calories_per_100g: Optional[float | Decimal] = None
    density_g_ml: Optional[float | Decimal] = None
    validated: Optional[bool] = None
    diet_level: Optional[int] = None

    class Config:
        from_attributes = True
        use_enum_values = True

# Output schema for ingredient details
class IngredientOut(BaseModel):
    ingredient_id: uuid.UUID
    name: str
    default_unit: MeasurementUnitEnum
    calories_per_100g: Optional[Decimal] = None # Use Decimal for precision
    validated: bool
    diet_level: int
    density_g_ml: Optional[Decimal] = None # Use Decimal for precision (matches Numeric(10,4))

    class Config:
        from_attributes = True
        use_enum_values = True

# Schema for linking nutrition values (needs revision based on API endpoint fix)
class NutritionLink(BaseModel):
    ingredient_id: uuid.UUID
    nutrition_id: uuid.UUID # Matches Nutrient.nutrient_id
    # If linking requires amount, add: amount: Decimal | float