import uuid
from sqlalchemy import Column, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class ApproximateMeasurement(Base):
    __tablename__ = "approximate_measurements"

    approximation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), nullable=False)
    measurement_type = Column(TEXT, nullable=False)  # e.g., "piece", "tbsp", "cup"
    value = Column(Numeric(10, 3), nullable=False)  # Measurement amount (e.g., 1 tbsp)
    equivalent_in_grams = Column(Numeric(10, 3), nullable=False)  # Approximate weight in grams
