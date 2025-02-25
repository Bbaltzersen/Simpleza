from pydantic import BaseModel
import uuid
from typing import List, Optional

# Request model for creating/updating a product
class ProductCreate(BaseModel):
    english_name: str
    spanish_name: str
    ean: Optional[str] = None  # Optional barcode
    amount: float
    measurement: str
    company_names: Optional[List[str]] = []  # List of company names

# Response model for returning product data
class ProductOut(BaseModel):
    product_id: uuid.UUID
    english_name: str
    spanish_name: str
    ean: Optional[str] = None
    amount: float
    measurement: str
    companies: List[str] = []  # List of associated company names

    class Config:
        from_attributes = True
