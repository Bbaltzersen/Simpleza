import uuid
from sqlalchemy import Column, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class Density(Base):
    __tablename__ = "densities"

    density_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), unique=True, nullable=False)
    density = Column(Numeric(10, 3), nullable=False)  # Density in g/ml
