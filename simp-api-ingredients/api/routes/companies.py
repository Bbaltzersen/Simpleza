from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from database.connection import SessionLocal

from models.company import Company

from schemas.company import CompanyCreate, CompanyOut

router = APIRouter(prefix="", tags=["Companies"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    """ Adds a new company if it does not already exist. """
    existing_company = db.query(Company).filter(Company.name == company.name).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="Company already exists")

    new_company = Company(name=company.name)
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company


@router.get("/", response_model=list[CompanyOut])
def read_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """ Retrieves a list of all companies (paginated). """
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies


@router.get("/{company_id}", response_model=CompanyOut)
def read_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Retrieves a specific company by ID. """
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("/{company_id}", response_model=CompanyOut)
def update_company(company_id: uuid.UUID, company_update: CompanyCreate, db: Session = Depends(get_db)):
    """ Updates the name of an existing company. """
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Update name if provided
    company.name = company_update.name
    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Deletes a company by ID. """
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.delete(company)
    db.commit()
    return None
