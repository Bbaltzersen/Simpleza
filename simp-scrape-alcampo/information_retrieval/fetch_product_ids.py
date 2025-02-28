import time
import uuid
import json
import gzip
import brotli
from dotenv import load_dotenv
from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from sqlalchemy.orm import Session
from models import AlcampoProductID
from db.connection import get_db

from schemas.alcampo_productid import AlcampoProductIDSchema

load_dotenv()

CATEGORY_URLS = [
    "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation",
    "https://www.compraonline.alcampo.es/categories/frescos/frutas/OC1701?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/verduras-y-hortalizas/OC1702?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/carne/OC13?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/pescados-mariscos-y-moluscos/OC14?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/ahumados-surimis-anchoas-pulpos-y-otros/OC184?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/charcutería/OC15?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/jamones-y-paletas/OC151001?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/quesos/OCQuesos?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/panadería/OC1281?sortBy=favorite"
]

def fetch_and_store_product_ids():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(options=options)

    try:
        for url in CATEGORY_URLS:
            driver.get(url)
            time.sleep(5)

            initial_data = driver.execute_script("return window.initialDocument")
            if initial_data and "productEntities" in initial_data:
                product_ids = [product["productId"] for product in initial_data["productEntities"].values()]
                store_product_ids_in_db(product_ids)

            previous_requests = set()
            while True:
                driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
                time.sleep(3)

                new_requests = {
                    request.url for request in driver.requests if "api/webproductpagews/v6/products" in request.url
                }

                new_requests = new_requests - previous_requests
                if not new_requests:
                    break

                previous_requests.update(new_requests)

                for request in driver.requests:
                    if request.url in new_requests and request.response:
                        try:
                            response_body = decode_response(request.response)
                            product_ids = extract_product_ids(response_body)
                            store_product_ids_in_db(product_ids)

                        except Exception as e:
                            print(f"Error parsing API response: {e}")

    except Exception as e:
        print(f"Error during scraping: {e}")

    finally:
        driver.quit()

def decode_response(response):
    encoding = response.headers.get("Content-Encoding", "").lower()
    body = response.body

    if "gzip" in encoding:
        body = gzip.decompress(body)
    elif "br" in encoding:
        body = brotli.decompress(body)

    return body.decode("utf-8")

def extract_product_ids(response_text):
    try:
        json_data = json.loads(response_text)
        if "products" in json_data:
            return [product["productId"] for product in json_data["products"]]
    except json.JSONDecodeError:
        pass

    return []

def store_product_ids_in_db(product_ids):
    db = next(get_db())  # Correct way to get a database session
    total_added = 0

    if not product_ids:
        return

    try:
        for product_id in product_ids:
            try:
                valid_product = AlcampoProductIDSchema(src_product_id=uuid.UUID(product_id))

                exists = db.query(AlcampoProductID).filter_by(src_product_id=valid_product.src_product_id).first()
                if exists:
                    continue

                new_product = AlcampoProductID(src_product_id=valid_product.src_product_id)
                db.add(new_product)
                db.commit()
                total_added += 1

            except ValueError:
                continue

    except Exception as e:
        print(f"Database error: {e}")

    finally:
        db.close()
        print(f"Total new product IDs added: {total_added}")