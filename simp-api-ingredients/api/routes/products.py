from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload # Import selectinload
from typing import Dict, List, Optional
import uuid
from decimal import Decimal, InvalidOperation # Import Decimal

from database.connection import SessionLocal
from models.database_tables import Product, Company, ProductCompany
# Import corrected schemas
from schemas.product import ProductOut, ProductCreate, ProductCompanyOut, ProductCompanyInfoOut, ProductUpdatePayload # Import ProductUpdatePayload if needed

router = APIRouter(prefix="", tags=["Products"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    # Check if product exists by a unique constraint, e.g., english_name or retail_id if unique
    # Using english_name for this example
    existing_product = db.query(Product).filter(Product.english_name == product_data.english_name).first()
    if existing_product:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product with this English name already exists")

    # Map fields, convert numbers to Decimal
    product_dict = product_data.model_dump(exclude_unset=True)
    if 'amount' in product_dict and product_dict['amount'] is not None:
         try:
            product_dict['amount'] = Decimal(product_dict['amount'])
         except InvalidOperation:
            raise HTTPException(status_code=422, detail="Invalid decimal value for amount")
    if 'weight' in product_dict and product_dict['weight'] is not None:
         try:
             product_dict['weight'] = Decimal(product_dict['weight'])
         except InvalidOperation:
            raise HTTPException(status_code=422, detail="Invalid decimal value for weight")

    new_product = Product(**product_dict)

    db.add(new_product)
    try:
        db.commit()
        db.refresh(new_product)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    # Return validated product, companies list will be empty initially
    return ProductOut.model_validate(new_product)

@router.get("/", response_model=Dict[str, List[ProductOut] | int])
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total_products = db.query(Product).count()
    # Eager load companies relationship and the company data within it
    products_db = db.query(Product).options(
            selectinload(Product.companies).selectinload(ProductCompany.company)
        ).offset(skip).limit(limit).all()

    # Validate output using Pydantic, which should handle the nested structure
    product_list_out = []
    for product in products_db:
        companies_info = []
        if product.companies: # Check if relationship was loaded and has data
            for pc_assoc in product.companies:
                if pc_assoc.company: # Check if nested company was loaded
                    companies_info.append(ProductCompanyInfoOut(
                        company_id=pc_assoc.company.company_id,
                        name=pc_assoc.company.name,
                        price=pc_assoc.price # price comes from the association object
                    ))

        # Manually construct dict for validation or rely on model_validate if Config works perfectly
        product_data_for_validation = {
            **product.__dict__,
            "companies": companies_info # Use the constructed list
        }
        product_list_out.append(ProductOut.model_validate(product_data_for_validation))


    return {
        "products": product_list_out,
        "total": total_products
    }

@router.get("/by-retail-id/{retail_id}", response_model=ProductOut) # Use specific path
def get_product_by_retail_id(retail_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).options(
            selectinload(Product.companies).selectinload(ProductCompany.company) # Eager load
        ).filter(Product.retail_id == retail_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found by retail ID")

    # Construct output similar to read_products
    companies_info = []
    if product.companies:
        for pc_assoc in product.companies:
            if pc_assoc.company:
                companies_info.append(ProductCompanyInfoOut(
                    company_id=pc_assoc.company.company_id,
                    name=pc_assoc.company.name,
                    price=pc_assoc.price
                ))

    product_data_for_validation = {
        **product.__dict__,
        "companies": companies_info
    }
    return ProductOut.model_validate(product_data_for_validation)

@router.get("/{product_id}", response_model=ProductOut) # Endpoint to get by primary key
def read_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    product = db.query(Product).options(
            selectinload(Product.companies).selectinload(ProductCompany.company) # Eager load
        ).filter(Product.product_id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Construct output similar to read_products
    companies_info = []
    if product.companies:
        for pc_assoc in product.companies:
            if pc_assoc.company:
                companies_info.append(ProductCompanyInfoOut(
                    company_id=pc_assoc.company.company_id,
                    name=pc_assoc.company.name,
                    price=pc_assoc.price
                ))

    product_data_for_validation = {
        **product.__dict__,
        "companies": companies_info
    }
    return ProductOut.model_validate(product_data_for_validation)


# Endpoint to update product (assuming ProductUpdatePayload exists and is similar to IngredientUpdate)
@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: uuid.UUID, product_update: ProductUpdatePayload, db: Session = Depends(get_db)):
    product = db.query(Product).options(
            selectinload(Product.companies).selectinload(ProductCompany.company) # Load needed for response
        ).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
         # Handle Decimal conversions for amount/weight
         if key in ['amount', 'weight'] and value is not None:
             try:
                 value = Decimal(value)
             except InvalidOperation:
                 raise HTTPException(status_code=422, detail=f"Invalid decimal value for {key}")

         if hasattr(product, key):
            setattr(product, key, value)
         else:
             print(f"Warning: Attribute '{key}' not found on Product model during update.")

    try:
        db.commit()
        db.refresh(product) # Refresh product itself
        # Need to manually reload relationships if they might have been affected by update indirectly,
        # or just reconstruct the output as done in GET requests.
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    # Re-fetch or reconstruct ProductOut similar to GET endpoints to include companies
    # Reconstructing for simplicity here:
    companies_info = []
    if product.companies: # Note: relationship might be stale after commit without refresh/reload
        db.refresh(product, attribute_names=['companies']) # Try refreshing relationship
        for pc_assoc in product.companies:
             db.refresh(pc_assoc, attribute_names=['company']) # Refresh nested company
             if pc_assoc.company:
                companies_info.append(ProductCompanyInfoOut(
                    company_id=pc_assoc.company.company_id,
                    name=pc_assoc.company.name,
                    price=pc_assoc.price
                ))

    product_data_for_validation = {
        **product.__dict__,
        "companies": companies_info
    }
    return ProductOut.model_validate(product_data_for_validation)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Associated ProductCompany links should cascade delete if DB schema is set up
    db.delete(product)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    return None


# --- Product <-> Company Linking ---

@router.post("/{product_id}/link-company/{company_name}", response_model=ProductCompanyOut, status_code=status.HTTP_201_CREATED)
def link_product_to_company(
    product_id: uuid.UUID,
    company_name: str,
    price: Optional[float] = Query(None, description="Price of the product at this company"), # Make price optional Query param
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    company = db.query(Company).filter(Company.name == company_name).first()
    if not company:
        # Optionally create company if not found, or raise error
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Company '{company_name}' not found. Create company first.")
        # company = Company(name=company_name)
        # db.add(company)
        # db.commit()
        # db.refresh(company)

    existing_link = db.query(ProductCompany).filter_by(product_id=product_id, company_id=company.company_id).first()
    if existing_link:
        # Option: Update price if already linked?
        # existing_link.price = Decimal(price) if price is not None else None
        # db.commit()
        # db.refresh(existing_link)
        # return ProductCompanyOut(...)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company already linked to this product")

    price_decimal: Optional[Decimal] = None
    if price is not None:
         try:
            price_decimal = Decimal(price)
         except InvalidOperation:
            raise HTTPException(status_code=422, detail="Invalid decimal value for price")

    product_company = ProductCompany(
        product_id=product_id,
        company_id=company.company_id,
        price=price_decimal # Use Decimal or None
    )
    db.add(product_company)
    try:
        db.commit()
        db.refresh(product_company)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

    # Construct response matching ProductCompanyOut
    return ProductCompanyOut(
        product_id=product_company.product_id,
        company_id=product_company.company_id,
        company_name=company.name, # Add company name from joined/queried company
        price=product_company.price
    )


@router.delete("/{product_id}/detach-company/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def detach_product_from_company(
    product_id: uuid.UUID,
    company_id: uuid.UUID,
    db: Session = Depends(get_db)
):
     link = db.query(ProductCompany).filter_by(product_id=product_id, company_id=company_id).first()
     if not link:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link between product and company not found")

     db.delete(link)
     try:
         db.commit()
     except Exception as e:
         db.rollback()
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")

     return None


@router.get("/{product_id}/companies", response_model=List[ProductCompanyOut])
def get_product_companies(product_id: uuid.UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Query ProductCompany joined with Company
    company_data = (
        db.query(ProductCompany.company_id, ProductCompany.price, Company.name)
        .join(Company, ProductCompany.company_id == Company.company_id)
        .filter(ProductCompany.product_id == product_id)
        .all()
    )

    # Construct list matching ProductCompanyOut
    return [
        ProductCompanyOut(
            product_id=product_id,
            company_id=cid,
            price=p,
            company_name=cname
        )
        for cid, p, cname in company_data
    ]

# Remove old get_product_by_retail_id if /by-retail-id/{retail_id} is preferred