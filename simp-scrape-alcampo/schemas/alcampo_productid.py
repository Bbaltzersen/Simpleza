from pydantic import BaseModel
import uuid

class AlcampoProductIDSchema(BaseModel):
    """Schema for validating Alcampo Product IDs"""
    src_product_id: uuid.UUID  # Ensure the product ID is a valid UUID

    class Config:
        from_attributes = True  # Allows ORM compatibility
