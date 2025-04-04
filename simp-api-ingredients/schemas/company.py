# schemas/company.py
from pydantic import BaseModel
import uuid
from typing import List

# For creating a company
class CompanyCreate(BaseModel):
    name: str

# For returning company data
class CompanyOut(BaseModel):
    company_id: uuid.UUID
    name: str

    class Config:
        from_attributes = True

# For paginated responses
class PaginatedCompanies(BaseModel):
    companies: List[CompanyOut]
    total: int