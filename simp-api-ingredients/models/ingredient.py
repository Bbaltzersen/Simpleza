import uuid
from sqlalchemy import Column, Numeric
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False)
    calories = Column(Numeric(10, 2))
