from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from database.connection import SessionLocal
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany
from schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
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

@router.get("/", response_model=list[ProductOut])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    product_list = []

    for product in products:
        company_data = db.query(ProductCompany.company_id, ProductCompany.price).filter(ProductCompany.product_id == product.product_id).all()
        company_prices = [{"company_name": db.query(Company.name).filter(Company.company_id == cid).scalar(), "price": price} for cid, price in company_data]

        product_list.append(ProductOut(
            product_id=product.product_id,
            retail_id=product.retail_id,
            english_name=product.english_name,
            spanish_name=product.spanish_name,
            amount=product.amount,
            weight=product.weight,
            measurement=product.measurement,
            companies=company_prices
        ))

    return product_list

@router.get("/{product_id}", response_model=ProductOut)
def read_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    company_data = db.query(ProductCompany.company_id, ProductCompany.price).filter(ProductCompany.product_id == product_id).all()
    company_prices = [{"company_name": db.query(Company.name).filter(Company.company_id == cid).scalar(), "price": price} for cid, price in company_data]

    return ProductOut(
        product_id=product.product_id,
        retail_id=product.retail_id,
        english_name=product.english_name,
        spanish_name=product.spanish_name,
        amount=product.amount,
        weight=product.weight,
        measurement=product.measurement,
        companies=company_prices
    )

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: uuid.UUID, product_update: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.retail_id = product_update.retail_id
    product.english_name = product_update.english_name
    product.spanish_name = product_update.spanish_name
    product.amount = product_update.amount
    product.weight = product_update.weight
    product.measurement = product_update.measurement

    db.query(ProductCompany).filter(ProductCompany.product_id == product_id).delete()

    linked_companies = []
    for company_name, price in product_update.company_prices.items():
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            company = Company(name=company_name)
            db.add(company)
            db.commit()
            db.refresh(company)

        product_company = ProductCompany(product_id=product.product_id, company_id=company.company_id, price=price)
        db.add(product_company)
        linked_companies.append({"company_name": company.name, "price": price})

    db.commit()
    db.refresh(product)

    return ProductOut(
        product_id=product.product_id,
        retail_id=product.retail_id,
        english_name=product.english_name,
        spanish_name=product.spanish_name,
        amount=product.amount,
        weight=product.weight,
        measurement=product.measurement,
        companies=linked_companies
    )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.query(ProductCompany).filter(ProductCompany.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return None