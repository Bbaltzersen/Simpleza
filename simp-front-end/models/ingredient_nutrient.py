# models/ingredient_nutrient.py
import uuid
from decimal import Decimal
from sqlalchemy import Column, Numeric, ForeignKey, Index, Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base

class IngredientNutrient(Base):
    """
    Junction table storing the value of a specific nutrient for a specific ingredient.
    """
    __tablename__ = "ingredient_nutrients"

    ingredient_nutrient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Link to the ingredient
    ingredient_id = Column(
        UUID(as_uuid=True),
        ForeignKey('ingredients.ingredient_id', ondelete='CASCADE'), # Use CASCADE delete
        nullable=False,
        index=True
    )
    # Link to the nutrient definition
    nutrient_id = Column(
        UUID(as_uuid=True),
        ForeignKey('nutrients.nutrient_id', ondelete='RESTRICT'), # Prevent deleting nutrient if values exist
        nullable=False,
        index=True
    )

    # The actual amount of the nutrient
    nutrient_value = Column(Numeric(12, 5), nullable=False) # Allow precision
    # Basis for the value (e.g., 'per 100g'). Standardize this.
    value_basis = Column(String(20), nullable=False, default='per 100g')

    # Admin validation status for this specific nutrient value entry
    validated = Column(Boolean, nullable=False, default=False, index=True)

    # --- Optional Foreign Keys ---
    # data_source_id = Column(Integer, ForeignKey('data_sources.source_id'), nullable=True)

    # --- Relationships ---
    ingredient = relationship("Ingredient", back_populates="nutrient_values")
    nutrient = relationship("Nutrient", back_populates="ingredient_values")
    # data_source = relationship("DataSource") # Define if using FK

    __table_args__ = (
        # Ensure unique entry per ingredient/nutrient/basis combination
        Index("uq_ingredient_nutrient_basis", "ingredient_id", "nutrient_id", "value_basis", unique=True),
        Index("idx_ingredient_nutrient_validated", "validated"),
    )

    def __repr__(self):
        return (f"<IngredientNutrient(ingredient_id='{self.ingredient_id}', "
                f"nutrient_id='{self.nutrient_id}', value='{self.nutrient_value}')>")