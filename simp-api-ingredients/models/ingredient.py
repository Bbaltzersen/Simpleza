from decimal import Decimal
from typing import Optional
import uuid
from pydantic import Field
from sqlalchemy import Column, Numeric
from sqlalchemy.dialects.postgresql import UUID, TEXT
from pydantic import BaseModel, Field
from .base import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False)
    default_unit = Column(TEXT, nullable=False, default="g")  # Default unit is grams
    calories_per_100g = Column(Numeric(10, 2), nullable=True)  # Calories per 100g
