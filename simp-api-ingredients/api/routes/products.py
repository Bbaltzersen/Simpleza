from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Dict, List
import uuid

from database.connection import SessionLocal
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany
from schemas.product import ProductOut, ProductCreate, ProductCompanyOut

router = APIRouter(prefix="", tags=["Products"])

def get_db():
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=Dict[str, List[ProductOut] | int])
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve paginated products with their linked companies."""
    total_products = db.query(Product).count()
    products = db.query(Product).offset(skip).limit(limit).all()

    product_list = []
    for product in products:
        company_data = (
            db.query(ProductCompany.company_id, Company.name, ProductCompany.price)
            .join(Company, ProductCompany.company_id == Company.company_id)
            .filter(ProductCompany.product_id == product.product_id)
            .all()
        )

        company_prices = [
            {"company_id": cid, "company_name": cname, "price": price}
            for cid, cname, price in company_data
        ]

        product_list.append(ProductOut(
            product_id=product.product_id,
            retail_id=product.retail_id,
            src_product_id=product.src_product_id,
            english_name=product.english_name,
            spanish_name=product.spanish_name,
            amount=product.amount,
            weight=product.weight,
            measurement=product.measurement,
            companies=company_prices
        ))

    return {
        "products": product_list,
        "total": total_products
    }

@router.get("/{product_id}/companies", response_model=List[ProductCompanyOut])
def get_product_companies(product_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve companies linked to a product."""
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    company_data = (
        db.query(ProductCompany.company_id, ProductCompany.price, Company.name)
        .join(Company, ProductCompany.company_id == Company.company_id)
        .filter(ProductCompany.product_id == product_id)
        .all()
    )


@router.post("/{product_id}/link-company/{company_name}", response_model=ProductCompanyOut, status_code=status.HTTP_201_CREATED)
def link_product_to_company(
    product_id: uuid.UUID,
    company_name: str,
    price: float,
    db: Session = Depends(get_db)
):
    """Link a company to a product based on company name."""
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    company = db.query(Company).filter(Company.name == company_name).first()
    if not company:
        company = Company(name=company_name)
        db.add(company)
        db.commit()
        db.refresh(company)

    existing_link = db.query(ProductCompany).filter(
        ProductCompany.product_id == product_id,
        ProductCompany.company_id == company.company_id
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Company already linked to this product")

    product_company = ProductCompany(
        product_id=product_id,
        company_id=company.company_id,
        price=price
    )
    db.add(product_company)
    db.commit()
    db.refresh(product_company)

    return ProductCompanyOut(
        product_id=product_company.product_id,
        company_id=product_company.company_id,
        company_name=company.name,
        price=product_company.price
    )



@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product with associated companies."""
    existing_product = db.query(Product).filter(Product.english_name == product.english_name).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product already exists")

    new_product = Product(
        retail_id=product.retail_id,
        english_name=product.english_name,
        spanish_name=product.spanish_name,
        amount=product.amount,
        weight=product.weight,
        measurement=product.measurement
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    linked_companies = []
    for company_name, price in product.company_prices.items():
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            company = Company(name=company_name)
            db.add(company)
            db.commit()
            db.refresh(company)

        product_company = ProductCompany(
            product_id=new_product.product_id, 
            company_id=company.company_id, 
            price=price
        )
        db.add(product_company)
        linked_companies.append({"company_name": company.name, "price": price})

    db.commit()

    return ProductOut(
        product_id=new_product.product_id,
        retail_id=new_product.retail_id,
        english_name=new_product.english_name,
        spanish_name=new_product.spanish_name,
        amount=new_product.amount,
        weight=new_product.weight,
        measurement=new_product.measurement,
        companies=linked_companies
    )


