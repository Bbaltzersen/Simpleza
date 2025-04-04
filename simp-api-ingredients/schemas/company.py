from pydantic import BaseModel
import uuid
from typing import List, Dict

class CompanyCreate(BaseModel):
    name: str

class CompanyOut(BaseModel):
    company_id: uuid.UUID
    name: str

    class Config:
        from_attributes = True

class PaginatedCompanies(BaseModel):
    companies: List[CompanyOut]
    total: int
