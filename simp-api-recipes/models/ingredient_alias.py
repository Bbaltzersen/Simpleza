# models/ingredient_alias.py
import uuid
from sqlalchemy import Column, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base

class IngredientAlias(Base):
    """
    Stores alternative names (synonyms, translations, brands) for an ingredient.
    """
    __tablename__ = "ingredient_aliases"

    alias_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Link back to the main ingredient
    ingredient_id = Column(
        UUID(as_uuid=True),
        ForeignKey('ingredients.ingredient_id', ondelete='CASCADE'), # Use CASCADE delete
        nullable=False,
        index=True
    )
    # The alternative name itself
    alias_name = Column(Text, nullable=False, index=True)
    # Optional: Type of alias (e.g., 'Common', 'Brand', 'Scientific', 'Translation')
    alias_type = Column(String(50), nullable=True)
    # Optional: Language code (e.g., 'en', 'es', 'fr') if it's a translation
    language_code = Column(String(10), nullable=True, index=True)

    # --- Relationship ---
    ingredient = relationship("Ingredient", back_populates="aliases")

    __table_args__ = (
        Index("idx_alias_name", "alias_name"),
        # Ensures an ingredient doesn't have the exact same alias name twice
        Index("uq_ingredient_alias_name", "ingredient_id", "alias_name", unique=True),
        Index("idx_alias_language_code", "language_code"), # Index if filtering by language
    )

    def __repr__(self):
        return f"<IngredientAlias(alias_id='{self.alias_id}', ingredient_id='{self.ingredient_id}', alias_name='{self.alias_name}')>"