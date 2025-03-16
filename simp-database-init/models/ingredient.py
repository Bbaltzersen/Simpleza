from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import Boolean, Column, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base
from sqlalchemy.dialects.postgresql import TSVECTOR

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    name_tsv = Column(TSVECTOR)  # ✅ Full-text search column
    default_unit = Column(TEXT, nullable=False, default="g")
    calories_per_100g = Column(Numeric(10, 2), nullable=True)
    validated =  Column(Boolean,nullable=False)

    __table_args__ = (
        Index("idx_ingredient_name", "name"),
        Index("idx_ingredient_name_tsv", "name_tsv", postgresql_using="gin"),  # ✅ Full-text search index
    )
