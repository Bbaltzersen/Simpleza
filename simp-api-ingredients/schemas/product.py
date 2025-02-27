from pydantic import BaseModel
import uuid
from typing import List, Optional, Dict

class ProductCreate(BaseModel):
    english_name: str
    spanish_name: str
    ean: Optional[str] = None
    amount: float
    weight: float
    measurement: str
    company_prices: Dict[str, float] = {}  # Mapping of company names to prices

class CompanyOut(BaseModel):
    company_name: str
    price: float

class ProductOut(BaseModel):
    product_id: uuid.UUID
    retail_id: Optional[int] = None
    english_name: str
    spanish_name: str
    ean: Optional[str] = None
    amount: float
    weight: float
    measurement: str
    companies: List[CompanyOut] = []  # List of associated companies with prices

    class Config:
        from_attributes = True
