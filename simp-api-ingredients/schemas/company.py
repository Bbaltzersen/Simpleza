from pydantic import BaseModel
import uuid

# Request model for creating/updating a company
class CompanyCreate(BaseModel):
    name: str

# Response model for returning company data
class CompanyOut(BaseModel):
    company_id: uuid.UUID
    name: str

    class Config:
        from_attributes = True
