from decimal import Decimal
import uuid
from sqlalchemy import Boolean, Column, Numeric, Index, Integer
from sqlalchemy.dialects.postgresql import UUID, TEXT, TSVECTOR
from .base import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    name_tsv = Column(TSVECTOR)  # ✅ Full-text search column
    default_unit = Column(TEXT, nullable=False, default="g")
    calories_per_100g = Column(Numeric(10, 2), nullable=True)  # ✅ Stores up to 2 decimal places
    validated = Column(Boolean, nullable=False, default=False)  # ✅ Default to False

    # ✅ Diet Classification (1 = Vegan, 2 = Vegetarian, 3 = Pescatarian, 4 = Omnivore)
    diet_level = Column(Integer, nullable=False, default=4)

    __table_args__ = (
        Index("idx_ingredient_name", "name"),
        Index("idx_ingredient_name_tsv", "name_tsv", postgresql_using="gin"),  # ✅ Full-text search index
    )
