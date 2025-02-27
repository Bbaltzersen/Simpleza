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
        return

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
            try:
                data = response.json()
                if "products" in data and data["products"]:
                    product = data["products"][0]

                    original_name = product.get("name", "").strip()
                    cleaned_name = preprocess_product_name(original_name)
                    english_name = translate_text(cleaned_name)

                    price = float(product["price"]["current"]["amount"]) if product.get("price") else None

                    weight_match = re.search(r"(\d+)\s*(g|kg|ml|l)", original_name)
                    weight = float(weight_match.group(1)) if weight_match else 0
                    measurement = weight_match.group(2) if weight_match else "unit"

                    new_product = Product(
                        product_id=uuid.uuid4(),
                        retail_id=product.get("retailerProductId"),
                        english_name=english_name,
                        spanish_name=cleaned_name,
                        amount=1,
                        weight=weight,
                        measurement=measurement
                    )
                    new_products.append(new_product)

                    if price is not None:
                        new_product_company = ProductCompany(
                            product_id=new_product.product_id,
                            company_id=alcampo_company.company_id,
                            price=price
                        )
                        new_product_companies.append(new_product_company)

            except Exception as e:
                print(f"Error processing product {product_id}: {e}")

        else:
            print(f"Failed to fetch details for product {product_id}. Status: {response.status_code}")

        time.sleep(1.5)

    if new_products:
        db.bulk_save_objects(new_products)
        db.commit()

    if new_product_companies:
        db.bulk_save_objects(new_product_companies)
        db.commit()

    db.close()
    print(f"Successfully stored {len(new_products)} products and {len(new_product_companies)} prices.")
