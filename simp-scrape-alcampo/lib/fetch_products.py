import requests
import uuid
import time
import re
from sqlalchemy.orm import Session
from db.connection import get_db
from models.product import Product, ProductCompany
from lib.clean_product_name import preprocess_product_name
from lib.translate_product_name import translate_text

ALCAMPO_API_URL = "https://www.compraonline.alcampo.es/api/v6/products/decorate?productIds="

def fetch_product_details():
    """Fetches product details from Alcampo API and stores them in the database."""
    
    db = next(get_db())  # Get database session
    product_ids = db.query(Product.product_id).all()  # Get product IDs from the database
    
    for product_id in product_ids:
        product_id = str(product_id[0])  # Extract UUID string
        response = requests.get(ALCAMPO_API_URL + product_id)

        if response.status_code == 200:
            data = response.json()
            if "products" in data and data["products"]:
                product = data["products"][0]  # Extract first product

                # Extract necessary fields
                original_name = product.get("name", "")
                cleaned_name = preprocess_product_name(original_name)
                english_name = translate_text(cleaned_name)

                # Extract pricing and amount details
                price = float(product["price"]["current"]["amount"]) if "price" in product else None
                weight_match = re.search(r"(\d+)\s*(g|kg|ml|l)", original_name)
                weight = float(weight_match.group(1)) if weight_match else 0  # Extract weight from name
                measurement = weight_match.group(2) if weight_match else "unit"

                # Store product in the database
                product_entry = Product(
                    product_id=uuid.uuid4(),
                    english_name=english_name,
                    spanish_name=cleaned_name,
                    amount=1,  # Default to 1 if not provided
                    weight=weight,
                    measurement=measurement
                )
                db.add(product_entry)
                db.commit()

                # Store price information in ProductCompany table
                product_company_entry = ProductCompany(
                    product_id=product_entry.product_id,
                    company_id=uuid.uuid4(),  # Generate a new company_id
                    price=price
                )
                db.add(product_company_entry)
                db.commit()

                print(f"Stored product: {english_name} - {price} EUR")

        else:
            print(f"Failed to fetch details for product {product_id}. Status code: {response.status_code}")
        
        # Pause between requests to avoid rate limits
        time.sleep(1)

    db.close()
