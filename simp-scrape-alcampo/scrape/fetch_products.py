import requests
import uuid
import time
import re
from sqlalchemy.orm import Session
from db.connection import get_db
from models.product import Product, ProductCompany, Company
from utils.clean_product_name import preprocess_product_name
from utils.translate_product_name import translate_text

# Alcampo API URL
ALCAMPO_API_URL = "https://www.compraonline.alcampo.es/api/v6/products/decorate?productIds="

def fetch_product_details():
    """Fetches product details from Alcampo API and stores them in the database."""
    
    db = next(get_db())  # Get database session

    # FIXED: Get product IDs correctly for SQLAlchemy 1.x
    product_ids = [str(row.product_id) for row in db.query(Product.product_id).all()]

    if not product_ids:
        print("No products found in the database.")
        db.close()
        return

    # Ensure "Alcampo" exists in `Company` table
    alcampo_company = db.query(Company).filter_by(name="Alcampo").first()
    if not alcampo_company:
        alcampo_company = Company(company_id=uuid.uuid4(), name="Alcampo")
        db.add(alcampo_company)
        db.commit()

    new_products = []
    new_product_companies = []

    for product_id in product_ids:
        response = requests.get(ALCAMPO_API_URL + product_id)

        if response.status_code == 200:
            data = response.json()
            if "products" in data and data["products"]:
                product = data["products"][0]  # Extract first product

                # Extract name and preprocess it
                original_name = product.get("name", "").strip()
                cleaned_name = preprocess_product_name(original_name)
                english_name = translate_text(cleaned_name)

                # Extract price (if available)
                price = float(product["price"]["current"]["amount"]) if product.get("price") else None

                # Extract weight and measurement unit from name
                weight_match = re.search(r"(\d+)\s*(g|kg|ml|l)", original_name)
                weight = float(weight_match.group(1)) if weight_match else 0
                measurement = weight_match.group(2) if weight_match else "unit"

                # Create new Product entry
                new_product = Product(
                    product_id=uuid.uuid4(),
                    retail_id=product.get("retailerProductId"),  # Store retailer product ID
                    english_name=english_name,
                    spanish_name=cleaned_name,
                    amount=1,  # Default amount
                    weight=weight,
                    measurement=measurement
                )
                new_products.append(new_product)

                # Create ProductCompany entry
                if price is not None:
                    new_product_company = ProductCompany(
                        product_id=new_product.product_id,
                        company_id=alcampo_company.company_id,
                        price=price
                    )
                    new_product_companies.append(new_product_company)

                print(f"Stored product: {english_name} - {price} EUR")

        else:
            print(f"Failed to fetch details for product {product_id}. Status: {response.status_code}")

        # Pause between requests to avoid rate limits
        time.sleep(1)

    # Bulk insert new products & prices
    if new_products:
        db.bulk_save_objects(new_products)
        db.commit()

    if new_product_companies:
        db.bulk_save_objects(new_product_companies)
        db.commit()

    db.close()
    print(f"Successfully stored {len(new_products)} products and {len(new_product_companies)} prices.")
