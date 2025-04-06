# models/ingredient_nutrient.py
import uuid
from decimal import Decimal
# Add typing import
from typing import Optional
from sqlalchemy import Column, Numeric, ForeignKey, Index, Boolean, String, DateTime, func, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
# Assuming Nutrient model is importable for relationship and type hints
# from .nutrient import Nutrient
# Assuming UnitNameEnum is importable if used for type hints
# from .enums import UnitNameEnum

class IngredientNutrient(Base):
    """
    Junction table storing the value of a specific nutrient for a specific ingredient.
    Includes properties to expose related nutrient details for API schemas.
    """
    __tablename__ = "ingredient_nutrients"

    ingredient_nutrient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey('ingredients.ingredient_id', ondelete='CASCADE'), nullable=False, index=True)
    nutrient_id = Column(UUID(as_uuid=True), ForeignKey('nutrients.nutrient_id', ondelete='RESTRICT'), nullable=False, index=True)
    nutrient_value = Column(Numeric(12, 5), nullable=False)
    value_basis = Column(String(20), nullable=False, default='per 100g')
    validated = Column(Boolean, nullable=False, default=False, index=True)

    # Assuming you add timestamps here too for consistency
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # --- Relationships ---
    ingredient = relationship("Ingredient", back_populates="nutrient_values")
    # Ensure correct back_populates in Nutrient model: ingredient_values = relationship("IngredientNutrient", ...)
    nutrient = relationship("Nutrient", back_populates="ingredient_values", lazy="joined") # Use joinedload or selectinload in queries

    # --- Properties for Pydantic Schemas ---
    @property
    def nutrient_name(self) -> Optional[str]:
        """Returns the name of the linked nutrient."""
        # Accesses the name via the 'nutrient' relationship
        return self.nutrient.nutrient_name if self.nutrient else None

    @property
    def unit(self) -> Optional[str]:
        """Returns the string value of the linked nutrient's unit."""
        # Accesses the unit via the 'nutrient' relationship
        if self.nutrient and self.nutrient.unit:
             # If Nutrient.unit is an Enum, return its value (e.g., "gram")
             # return self.nutrient.unit.value
             # If Nutrient.unit is already loaded as a string (based on previous error)
             return self.nutrient.unit
        return None

    # --- Table Arguments ---
    __table_args__ = (
        Index("uq_ingredient_nutrient_basis", "ingredient_id", "nutrient_id", "value_basis", unique=True),
        Index("idx_ingredient_nutrient_validated", "validated"),
        CheckConstraint('nutrient_value >= 0', name='ingredient_nutrient_value_non_negative'),
    )

    def __repr__(self):
        # Ensure ingredient_id and nutrient_id are accessed correctly if needed in repr
        # Using self.nutrient_id and self.ingredient_id which are direct columns
        return (f"<IngredientNutrient(ingredient_id='{self.ingredient_id}', "
                f"nutrient_id='{self.nutrient_id}', value='{self.nutrient_value}')>")