# models/ingredient.py
from sqlalchemy import Column, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from models.base import Base

class Ingredient(Base):
    __tablename__ = "ingredients"
    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, unique=True, nullable=False)  # unique constraint here
    calories = Column(Numeric(10, 2))
