# models/ingredient.py
import uuid
from decimal import Decimal
from sqlalchemy import (
    Boolean, Column, Numeric, Index, Integer, String, ForeignKey, Text
)
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
from .base import Base

class Ingredient(Base):
    """
    Represents a food item or ingredient.
    """
    __tablename__ = "ingredients"

    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # --- Core Identification ---
    # Primary display name - NOT unique to allow variations via aliases
    name = Column(Text, nullable=False, index=True)
    description = Column(Text, nullable=True) # Optional detailed description
    # For full-text search capabilities on the name/aliases
    name_tsv = Column(TSVECTOR)

    # --- Physical Properties ---
    # Density in g/mL (or chosen standard units) for volume conversions
    density_g_per_ml = Column(Numeric(10, 5), nullable=True)
    # Default unit for quantity input (e.g., in recipes). Purpose should be clear in application logic.
    default_unit = Column(String(10), nullable=False, default="g")

    # --- Classification & Metadata ---
    # Diet Classification (e.g., 1=Vegan, 2=Vegetarian, 3=Pescatarian, 4=Omnivore)
    diet_level = Column(Integer, nullable=False, default=4)
    # Admin validation status for the ingredient itself
    validated = Column(Boolean, nullable=False, default=False, index=True)

    # --- Optional Foreign Keys (Uncomment and define related tables if used) ---
    # food_group_id = Column(Integer, ForeignKey('food_groups.group_id'), nullable=True)
    # data_source_id = Column(Integer, ForeignKey('data_sources.source_id'), nullable=True)

    # --- Relationships ---
    # Nutrient values associated with this ingredient
    nutrient_values = relationship(
        "IngredientNutrient",
        back_populates="ingredient",
        cascade="all, delete-orphan", # Delete nutrient values if ingredient is deleted
        passive_deletes=True,
    )
    # Alternative names/aliases for this ingredient
    aliases = relationship(
        "IngredientAlias",
        back_populates="ingredient",
        cascade="all, delete-orphan", # Delete aliases if ingredient is deleted
        passive_deletes=True,
    )
    # Relationships back to optional FK tables (Uncomment if FKs are used)
    # food_group = relationship("FoodGroup", back_populates="ingredients")
    # data_source = relationship("DataSource", back_populates="ingredients")

    __table_args__ = (
        Index("idx_ingredient_name", "name"),
        Index("idx_ingredient_name_tsv", "name_tsv", postgresql_using="gin"),
        Index("idx_ingredient_validated", "validated"),
        # Optional: Index on diet_level if frequently queried
        # Index("idx_ingredient_diet_level", "diet_level"),
    )

    def __repr__(self):
        return f"<Ingredient(ingredient_id='{self.ingredient_id}', name='{self.name}')>"