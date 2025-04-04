# schemas/nutrition.py
from pydantic import BaseModel, Field
import uuid
from typing import Optional, List, Dict, Any
from decimal import Decimal # Import Decimal for numeric fields

# Import Enums from your models/database_tables.py or equivalent shared location
from models.database_tables import (
    MeasurementUnitEnum,
    NutrientCategoryEnum,
    AminoAcidTypeEnum,
    VitaminSolubilityEnum,
    FattyAcidSaturationEnum,
    SterolTypeEnum,
    NutrientStatusEnum
)

# --------------------
# Input Schema
# --------------------
class NutritionCreate(BaseModel):
    """Schema for creating a new Nutrient."""
    # Core required fields
    name: str = Field(..., description="Unique name of the nutrient")
    storage_unit: MeasurementUnitEnum = Field(..., description="Default unit for storing values (e.g., g, mg, µg)")
    category: NutrientCategoryEnum = Field(..., description="Primary category (e.g., Macronutrient)")

    # Optional fields settable on creation
    subtype: Optional[str] = Field(None, description="More specific subtype (e.g., Vitamin B group, Omega-3)")
    efsa_id: Optional[str] = Field(None, description="EFSA specific ID if available")
    usda_nutrient_id: Optional[str] = Field(None, description="USDA FoodData Central Nutrient ID if available")
    cas_number: Optional[str] = Field(None, description="CAS registry number")
    synonyms: Optional[List[str]] = Field(None, description="Alternative names or synonyms")
    preferred_display_unit: Optional[MeasurementUnitEnum] = Field(None, description="Optional different unit for display")
    conversion_factors: Optional[Dict[str, Any]] = Field(None, description="JSON object with unit conversion rules if applicable") # e.g., {"IU_to_mcg_RAE": 0.3}
    amino_acid_type: Optional[AminoAcidTypeEnum] = None
    vitamin_solubility: Optional[VitaminSolubilityEnum] = None
    fatty_acid_saturation: Optional[FattyAcidSaturationEnum] = None
    sterol_type: Optional[SterolTypeEnum] = None
    is_essential: Optional[bool] = Field(None, description="Is this nutrient essential for humans?")
    is_sugar: Optional[bool] = Field(None, description="Is this nutrient classified as a sugar?")
    is_fiber: Optional[bool] = Field(None, description="Is this nutrient classified as dietary fiber?")
    parent_id: Optional[uuid.UUID] = Field(None, description="ID of the parent nutrient in a hierarchy (e.g., 'Total Fat' for 'Saturated Fat')")
    is_eu_mandatory_nutrient: Optional[bool] = Field(False, description="Is this mandatory on EU nutrition labels?")
    is_eu_reference_intake_nutrient: Optional[bool] = Field(False, description="Does this nutrient have an EU Reference Intake (RI)?")
    eu_reference_intake_value: Optional[float | Decimal] = Field(None, description="Value for 100% RI (if applicable)") # Accept float for input ease
    eu_reference_intake_unit: Optional[MeasurementUnitEnum] = Field(None, description="Unit for the RI value")
    sort_order: Optional[int] = Field(0, description="Order for display purposes")
    definition_source: Optional[str] = Field(None, description="Source of the nutrient's definition/metadata")
    status: Optional[NutrientStatusEnum] = Field(NutrientStatusEnum.ACTIVE, description="Status of the nutrient record")
    description: Optional[str] = Field(None, description="General description or notes about the nutrient")

    class Config:
        from_attributes = True # Enable ORM mode / mapping from SQLAlchemy models
        use_enum_values = True # Allow passing/receiving enum values (e.g., "g", "Macronutrient") instead of objects

# --------------------
# Output Schema
# --------------------
class NutritionOut(BaseModel):
    """Schema for returning Nutrient details."""
    nutrient_id: uuid.UUID
    name: str
    storage_unit: MeasurementUnitEnum
    category: NutrientCategoryEnum
    status: NutrientStatusEnum
    subtype: Optional[str] = None
    efsa_id: Optional[str] = None
    usda_nutrient_id: Optional[str] = None
    cas_number: Optional[str] = None
    synonyms: Optional[List[str]] = None
    preferred_display_unit: Optional[MeasurementUnitEnum] = None
    conversion_factors: Optional[Dict[str, Any]] = None # Be mindful if this is too large/complex for general output
    amino_acid_type: Optional[AminoAcidTypeEnum] = None
    vitamin_solubility: Optional[VitaminSolubilityEnum] = None
    fatty_acid_saturation: Optional[FattyAcidSaturationEnum] = None
    sterol_type: Optional[SterolTypeEnum] = None
    is_essential: Optional[bool] = None
    is_sugar: Optional[bool] = None
    is_fiber: Optional[bool] = None
    parent_id: Optional[uuid.UUID] = None
    is_eu_mandatory_nutrient: Optional[bool] = None
    is_eu_reference_intake_nutrient: Optional[bool] = None
    eu_reference_intake_value: Optional[Decimal] = None # Use Decimal for precise output
    eu_reference_intake_unit: Optional[MeasurementUnitEnum] = None
    sort_order: int
    definition_source: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True # Enable ORM mode / mapping from SQLAlchemy models
        use_enum_values = True # Output enum values

# You might also want a schema specifically for updating, similar to IngredientUpdate:
class NutritionUpdate(BaseModel):
    """Schema for updating Nutrient details (partial updates)."""
    name: Optional[str] = None
    storage_unit: Optional[MeasurementUnitEnum] = None
    category: Optional[NutrientCategoryEnum] = None
    subtype: Optional[str] = None
    efsa_id: Optional[str] = None
    usda_nutrient_id: Optional[str] = None
    cas_number: Optional[str] = None
    synonyms: Optional[List[str]] = None
    preferred_display_unit: Optional[MeasurementUnitEnum] = None
    conversion_factors: Optional[Dict[str, Any]] = None
    amino_acid_type: Optional[AminoAcidTypeEnum] = None
    vitamin_solubility: Optional[VitaminSolubilityEnum] = None
    fatty_acid_saturation: Optional[FattyAcidSaturationEnum] = None
    sterol_type: Optional[SterolTypeEnum] = None
    is_essential: Optional[bool] = None
    is_sugar: Optional[bool] = None
    is_fiber: Optional[bool] = None
    parent_id: Optional[uuid.UUID] = None # Be careful allowing parent changes
    is_eu_mandatory_nutrient: Optional[bool] = None
    is_eu_reference_intake_nutrient: Optional[bool] = None
    eu_reference_intake_value: Optional[float | Decimal] = None
    eu_reference_intake_unit: Optional[MeasurementUnitEnum] = None
    sort_order: Optional[int] = None
    definition_source: Optional[str] = None
    status: Optional[NutrientStatusEnum] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True
        use_enum_values = True