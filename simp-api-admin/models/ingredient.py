# models/ingredient.py
import uuid
import enum # Import enum module
from decimal import Decimal
from sqlalchemy import (
    Boolean, Column, Numeric, Index, Integer, String, ForeignKey, Text,
    DateTime, func, CheckConstraint # Added DateTime, func, CheckConstraint
)
# Import Enum type from SQLAlchemy
from sqlalchemy import Enum as SQLEnum
# Assuming enums are defined in models/enums.py
from .enums import UnitNameEnum, DietLevelEnum
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
from .base import Base

class Ingredient(Base):
    """
    Represents a food item or ingredient.
    Includes standardization for units/diet level, timestamps, and constraints.
    """
    __tablename__ = "ingredients"

    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # --- Core Identification ---
    name = Column(Text, nullable=False, index=True)
    description = Column(Text, nullable=True)
    name_tsv = Column(TSVECTOR) # Requires trigger/logic to populate

    # --- Physical Properties ---
    density_g_per_ml = Column(Numeric(10, 5), nullable=True)

    # Use Enum for default_unit (using full names as requested previously)
    default_unit = Column(
        SQLEnum(UnitNameEnum, name='unit_name_enum', create_type=False), # Assumes Nutrient model creates the DB Enum type first
        nullable=False,
        default=UnitNameEnum.GRAM # Use Enum member for default
    )

    # --- Classification & Metadata ---
    # Use Enum for diet_level
    diet_level = Column(
        SQLEnum(DietLevelEnum, name='diet_level_enum', create_type=True), # Assume this model creates the DB Enum type
        nullable=False,
        default=DietLevelEnum.OMNIVORE
    )
    validated = Column(Boolean, nullable=False, default=False, index=True)

    # --- Timestamps ---
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # --- Relationships (Keep as is for now) ---
    nutrient_values = relationship(
        "IngredientNutrient",
        back_populates="ingredient",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    aliases = relationship(
        "IngredientAlias",
        back_populates="ingredient",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # --- Table Arguments (Indices and Constraints) ---
    __table_args__ = (
        Index("idx_ingredient_name", "name"),
        Index("idx_ingredient_name_tsv", "name_tsv", postgresql_using="gin"),
        Index("idx_ingredient_validated", "validated"),
        # Add CHECK constraint for density
        CheckConstraint('density_g_per_ml IS NULL OR density_g_per_ml > 0', name='ingredient_density_positive_or_null'),
        # CheckConstraint for diet_level is implicitly handled by Enum now
    )

    def __repr__(self):
        return f"<Ingredient(ingredient_id='{self.ingredient_id}', name='{self.name}')>"