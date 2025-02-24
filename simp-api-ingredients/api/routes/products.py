from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

# Import database connection
from database.connection import SessionLocal
# Import models
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany
# Import schemas from new schemas folder
from schemas.product import ProductCreate, ProductOut

# Initialize the FastAPI router
router = APIRouter(prefix="/products", tags=["Products"])

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#######################################
#         Product CRUD Routes         #
#######################################

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """ Adds a new product and links it to companies. """

    # Check if product exists
    existing_product = db.query(Product).filter(Product.name == product.name).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product already exists")

    # Create new product
    new_product = Product(
        name=product.name,
        ean=product.ean,
        amount=product.amount,
        measurement=product.measurement
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    # Handle Company Names
    linked_companies = []
    for company_name in product.company_names:
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            # Create new company if it doesn't exist
            company = Company(name=company_name)
            db.add(company)
            db.commit()
            db.refresh(company)

        # Link product to company
        product_company = ProductCompany(product_id=new_product.product_id, company_id=company.company_id)
        db.add(product_company)
        linked_companies.append(company.name)

    db.commit()
    
    return ProductOut(
        product_id=new_product.product_id,
        name=new_product.name,
        ean=new_product.ean,
        amount=new_product.amount,
        measurement=new_product.measurement,
        companies=linked_companies
    )


@router.get("/", response_model=list[ProductOut])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """ Retrieves a list of all products (paginated). """
    products = db.query(Product).offset(skip).limit(limit).all()

    # Retrieve companies for each product
    product_list = []
    for product in products:
        company_ids = db.query(ProductCompany.company_id).filter(ProductCompany.product_id == product.product_id).all()
        company_names = [db.query(Company.name).filter(Company.company_id == cid[0]).scalar() for cid in company_ids]
        product_list.append(ProductOut(
            product_id=product.product_id,
            name=product.name,
            ean=product.ean,
            amount=product.amount,
            measurement=product.measurement,
            companies=company_names
        ))

    return product_list


@router.get("/{product_id}", response_model=ProductOut)
def read_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Retrieves a specific product by ID. """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    company_ids = db.query(ProductCompany.company_id).filter(ProductCompany.product_id == product_id).all()
    company_names = [db.query(Company.name).filter(Company.company_id == cid[0]).scalar() for cid in company_ids]

    return ProductOut(
        product_id=product.product_id,
        name=product.name,
        ean=product.ean,
        amount=product.amount,
        measurement=product.measurement,
        companies=company_names
    )


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: uuid.UUID, product_update: ProductCreate, db: Session = Depends(get_db)):
    """ Updates an existing product. """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update product details
    product.name = product_update.name
    product.ean = product_update.ean
    product.amount = product_update.amount
    product.measurement = product_update.measurement

    # Update companies
    db.query(ProductCompany).filter(ProductCompany.product_id == product_id).delete()

    linked_companies = []
    for company_name in product_update.company_names:
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            company = Company(name=company_name)
            db.add(company)
            db.commit()
            db.refresh(company)

        product_company = ProductCompany(product_id=product.product_id, company_id=company.company_id)
        db.add(product_company)
        linked_companies.append(company.name)

    db.commit()
    db.refresh(product)

    return ProductOut(
        product_id=product.product_id,
        name=product.name,
        ean=product.ean,
        amount=product.amount,
        measurement=product.measurement,
        companies=linked_companies
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    """ Deletes a product by ID. """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.query(ProductCompany).filter(ProductCompany.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return None
