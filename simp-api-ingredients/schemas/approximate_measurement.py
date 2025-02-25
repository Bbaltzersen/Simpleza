from pydantic import BaseModel
import uuid

# Request model for approximate measurement
class ApproximateMeasurementCreate(BaseModel):
    ingredient_id: uuid.UUID
    measurement_type: str  # e.g., "piece", "tbsp", "cup"
    value: float  # Measurement amount (e.g., 1 tbsp)
    equivalent_in_grams: float  # Approximate weight in grams

# Response model for returning approximate measurement data
class ApproximateMeasurementOut(BaseModel):
    measurement_id: uuid.UUID
    ingredient_id: uuid.UUID
    measurement_type: str
    value: float
    equivalent_in_grams: float

    class Config:
        from_attributes = True
