import requests
import uuid
import time
import re
from sqlalchemy.orm import Session
from db.connection import get_db
from models.product import Product, ProductCompany, Company
from models.alcampo_productid import AlcampoProductID
from utils.clean_product_name import preprocess_product_name
from utils.translate_product_name import translate_text

ALCAMPO_API_URL = "https://www.compraonline.alcampo.es/api/v6/products/decorate?productIds="

def fetch_product_details():
    db = next(get_db())

    product_ids = [str(row.src_product_id) for row in db.query(AlcampoProductID.src_product_id).all()]

    if not product_ids:
        db.close()
        print("No products found in the database.")
        return

    print(f"Fetching details for {len(product_ids)} products...")

    alcampo_company = db.query(Company).filter_by(name="Alcampo").first()
    if not alcampo_company:
        alcampo_company = Company(company_id=uuid.uuid4(), name="Alcampo")
        db.add(alcampo_company)
        db.commit()

    for product_id in product_ids:
        request_url = ALCAMPO_API_URL + product_id
        response = requests.get(request_url)

        if response.status_code == 200:
            try:
                data = response.json()
                if "products" not in data or not data["products"]:
                    print(f"API returned empty data for {product_id}. Response: {data}")
                    continue

                product = data["products"][0]

                original_name = product.get("name", "").strip()
                cleaned_name_data = preprocess_product_name(original_name)

                cleaned_name = cleaned_name_data["cleaned_name"] if isinstance(cleaned_name_data, dict) and "cleaned_name" in cleaned_name_data else cleaned_name_data

                english_name_result = translate_text(cleaned_name)
                if isinstance(english_name_result, list):
                    english_name = " ".join([t.text if hasattr(t, "text") else str(t) for t in english_name_result])
                elif hasattr(english_name_result, "text"):
                    english_name = english_name_result.text
                else:
                    english_name = str(english_name_result)

                price = float(product["price"]["current"]["amount"]) if product.get("price") else None

                weight_match = re.search(r"(\d+)\s*(g|kg|ml|l)", original_name)
                weight = float(weight_match.group(1)) if weight_match else 0
                measurement = weight_match.group(2) if weight_match else "unit"

                retail_id = product.get("retailerProductId")

                new_product = Product(
                    product_id=uuid.uuid4(),
                    retail_id=retail_id,
                    src_product_id=product_id,
                    english_name=english_name,
                    spanish_name=cleaned_name,
                    amount=1,
                    weight=weight,
                    measurement=measurement
                )
                db.add(new_product)
                db.commit()
                print(f"Added product: {english_name}")

                if price is not None:
                    new_product_company = ProductCompany(
                        product_id=new_product.product_id,
                        company_id=alcampo_company.company_id,
                        price=price
                    )
                    db.add(new_product_company)
                    db.commit()
                    print(f"Added price: {price} EUR for {english_name}")

            except Exception as e:
                print(f"Error processing product {product_id}: {e}")
                print(f"API Response: {response.text}")
                db.rollback()

        else:
            print(f"Failed to fetch details for product {product_id}. Status: {response.status_code}. Response: {response.text}")

        time.sleep(1.5)

    db.close()
    print("Product fetching completed.")
