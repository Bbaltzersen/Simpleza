# schemas/product.py
from pydantic import BaseModel
import uuid
from typing import List, Optional, Dict
from decimal import Decimal # Use Decimal for output precision
# Assuming MeasurementUnitEnum is importable
from models.database_tables import MeasurementUnitEnum

# Input schema for creating products
class ProductCreate(BaseModel):
    retail_id: Optional[str] = None # Changed from int to str
    src_product_id: Optional[uuid.UUID] = None
    english_name: str
    spanish_name: Optional[str] = None # Changed to Optional[str]
    amount: float | Decimal # Accept float or Decimal, backend handles
    weight: Optional[float | Decimal] = None # Changed to Optional
    measurement: Optional[MeasurementUnitEnum] = None # Changed to Optional[Enum]
    # Removed company_prices - handle linking separately

    class Config:
        from_attributes = True
        use_enum_values = True # Needed for MeasurementUnitEnum input

# Output schema for company linked within ProductOut
class ProductCompanyInfoOut(BaseModel): # Renamed slightly to avoid confusion with schemas/company.py
    company_id: uuid.UUID
    name: str # Assuming Company model has 'name'
    price: Optional[Decimal] = None # Comes from ProductCompany, use Decimal, make Optional

    class Config:
        from_attributes = True

# Output schema for product details
class ProductOut(BaseModel):
    product_id: uuid.UUID
    retail_id: Optional[str] = None # Changed from int to str
    src_product_id: Optional[uuid.UUID] = None
    english_name: str
    spanish_name: Optional[str] = None # Changed to Optional[str]
    amount: Decimal # Changed to Decimal
    weight: Optional[Decimal] = None # Changed to Optional[Decimal]
    measurement: Optional[MeasurementUnitEnum] = None # Changed to Optional[Enum]
    companies: List[ProductCompanyInfoOut] = [] # Use the specific nested schema

    class Config:
        from_attributes = True
        use_enum_values = True # Needed for MeasurementUnitEnum output

# Schema for representing the ProductCompany join table data (if needed directly)
class ProductCompanyOut(BaseModel):
    product_id: uuid.UUID
    company_id: uuid.UUID
    # If you need company name here, you'd typically query/join it
    # company_name: str # This isn't directly on the join table
    price: Optional[Decimal] = None # Changed to Decimal, make Optional

    class Config:
        from_attributes = True

class ProductUpdatePayload(BaseModel):
    """Schema for updating Product details (partial updates)."""
    retail_id: Optional[str] = None
    src_product_id: Optional[uuid.UUID] = None
    english_name: Optional[str] = None
    spanish_name: Optional[str] = None
    amount: Optional[float | Decimal] = None # Accept float or Decimal for input
    weight: Optional[float | Decimal] = None
    measurement: Optional[MeasurementUnitEnum] = None # Use the Enum

    class Config:
        from_attributes = True # Allow creation from ORM models if needed elsewhere
        use_enum_values = True # Allow enum values ("g", "ml") in input/output