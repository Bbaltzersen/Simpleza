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

    product_data = db.query(AlcampoProductID.src_product_id, AlcampoProductID.product_id).all()

    if not product_data:
        db.close()
        print("No products found in the database.")
        return

    alcampo_company = db.query(Company).filter_by(name="Alcampo").first()
    if not alcampo_company:
        alcampo_company = Company(company_id=uuid.uuid4(), name="Alcampo")
        db.add(alcampo_company)
        db.commit()

    for src_product_id, existing_product_id in product_data:
        response = requests.get(ALCAMPO_API_URL + str(src_product_id))

        if response.status_code == 200:
            try:
                data = response.json()
                if "products" in data and data["products"]:
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

                    if existing_product_id:
                        existing_product = db.query(Product).filter_by(product_id=existing_product_id).first()
                        if existing_product:
                            existing_product.retail_id = retail_id
                            existing_product.english_name = english_name
                            existing_product.spanish_name = cleaned_name
                            existing_product.weight = weight
                            existing_product.measurement = measurement
                            db.commit()
                            print(f"Updated product: {english_name}")
                    else:
                        new_product_id = uuid.uuid4()
                        new_product = Product(
                            product_id=new_product_id,
                            retail_id=retail_id,
                            src_product_id=src_product_id,
                            english_name=english_name,
                            spanish_name=cleaned_name,
                            amount=1,
                            weight=weight,
                            measurement=measurement
                        )
                        db.add(new_product)
                        db.commit()
                        print(f"Added new product: {english_name}")

                        new_alcampo_product = AlcampoProductID(
                            src_product_id=src_product_id,
                            product_id=new_product_id
                        )
                        db.add(new_alcampo_product)
                        db.commit()

                    if price is not None:
                        existing_product_company = db.query(ProductCompany).filter_by(
                            product_id=existing_product_id or new_product_id,
                            company_id=alcampo_company.company_id
                        ).first()

                        if existing_product_company:
                            existing_product_company.price = price
                            db.commit()
                            print(f"Updated price: {price} EUR for {english_name}")
                        else:
                            new_product_company = ProductCompany(
                                product_id=existing_product_id or new_product_id,
                                company_id=alcampo_company.company_id,
                                price=price
                            )
                            db.add(new_product_company)
                            db.commit()
                            print(f"Added price: {price} EUR for {english_name}")

            except Exception as e:
                print(f"Error processing product {src_product_id}: {e}")
                db.rollback()

        else:
            print(f"Failed to fetch details for product {src_product_id}. Status: {response.status_code}")

        time.sleep(1.5)

    db.close()
    print("Product fetching completed.")
