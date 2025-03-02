from pydantic import BaseModel
import uuid
from typing import List, Optional, Dict

class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    retail_id: Optional[int] = None
    src_product_id: Optional[uuid.UUID] = None  # Matches DB field
    english_name: str
    spanish_name: str
    amount: float
    weight: float
    measurement: str
    company_prices: Dict[str, float] = {}  # Mapping of company names to prices

class CompanyOut(BaseModel):
    """Schema for returning company details linked to a product."""
    company_id: uuid.UUID
    company_name: str
    price: float

class ProductOut(BaseModel):
    """Schema for returning product details."""
    product_id: uuid.UUID
    retail_id: Optional[int] = None
    src_product_id: Optional[uuid.UUID] = None  # Matches DB field
    english_name: str
    spanish_name: str
    amount: float
    weight: float
    measurement: str
    companies: List[CompanyOut] = []  # List of associated companies with prices

    class Config:
        from_attributes = True  # Ensures SQLAlchemy -> Pydantic conversion

class ProductCompanyOut(BaseModel):
    """Schema for returning linked product-company relationships."""
    product_id: uuid.UUID  # Matches DB field
    company_id: uuid.UUID
    company_name: str
    price: float
