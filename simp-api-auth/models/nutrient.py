# models/nutrient.py
import uuid
from sqlalchemy import Column, Numeric, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base

class Nutrient(Base):
    """
    Defines a nutrient and its classification/metadata.
    """
    __tablename__ = "nutrients"

    nutrient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Standard name, should be unique
    nutrient_name = Column(Text, unique=True, nullable=False, index=True)
    # Optional common symbol/shorthand (e.g., 'PROCNT', 'CA') - enforce uniqueness if used
    nutrient_symbol = Column(String(20), unique=True, nullable=True, index=True)
    # Standard unit of measurement (e.g., g, mg, µg, kcal)
    unit = Column(String(10), nullable=False)
    # Number of decimal places typically used for display/rounding
    nutrient_decimals = Column(Integer, nullable=False, default=2)

    # --- Classification Hierarchy ---
    primary_group = Column(String(50), nullable=True, index=True) # e.g., Macronutrient, Micronutrient
    secondary_group = Column(String(50), nullable=True, index=True) # e.g., Protein, Vitamin, Mineral
    tertiary_group = Column(String(100), nullable=True, index=True) # e.g., Essential Amino Acid, Fat-Soluble
    quaternary_group = Column(String(100), nullable=True, index=True) # e.g., Monosaccharide, BCAA

    # --- Optional Metadata ---
    description = Column(Text, nullable=True)
    # For controlling display order in reports/UI
    sort_order = Column(Integer, nullable=True, default=9999)

    # --- Relationships ---
    # Values of this nutrient found in different ingredients
    ingredient_values = relationship(
        "IngredientNutrient",
        back_populates="nutrient"
        # cascade not typically set here, deleting a nutrient definition is major
    )
    # Recommendations associated with this nutrient
    recommendations = relationship(
        "NutrientRecommendation",
        back_populates="nutrient"
        # cascade not typically set here
    )

    def __repr__(self):
        return f"<Nutrient(nutrient_id='{self.nutrient_id}', name='{self.nutrient_name}', unit='{self.unit}')>"