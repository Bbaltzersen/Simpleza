import requests
import json
import gzip
import uuid
from io import BytesIO
from sqlalchemy.orm import Session
from db.connection import get_db
from models.alcampo_productid import AlcampoProductID
from schemas.alcampo_productid import AlcampoProductIDSchema

ALCAMPO_API_URL = "https://www.compraonline.alcampo.es/api/v6/products"

def fetch_and_store_product_ids():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
        "Accept-Encoding": "gzip, deflate"  # Accepts gzip but does not assume it's always compressed
    }

    db = next(get_db())  # Get database session
    next_page_token = None
    total_added = 0

    while True:
        params = {}
        if next_page_token:
            params["nextPageToken"] = next_page_token  # Add pagination token

        response = requests.get(ALCAMPO_API_URL, headers=headers, params=params)

        if response.status_code == 200:
            try:
                response_text = decode_response(response)

                data = json.loads(response_text)

                if "products" in data and isinstance(data["products"], list):
                    product_ids = [product["productId"] for product in data["products"]]

                    # Store product IDs in the database
                    added_count = store_product_ids_in_db(db, product_ids)
                    total_added += added_count

                next_page_token = data.get("nextPageToken")

                if not next_page_token:
                    break  # Stop if no more pages

            except json.JSONDecodeError:
                print("Error decoding JSON response.")
                break

        else:
            print(f"Failed to fetch products. Status: {response.status_code}")
            break

    db.close()
    print(f"Total new product IDs added: {total_added}")

def decode_response(response):
    """Handles gzip and non-gzip responses properly."""
    encoding = response.headers.get("Content-Encoding", "").lower()

    # If the response is gzip-encoded, decompress it
    if "gzip" in encoding:
        try:
            with BytesIO(response.content) as compressed:
                with gzip.GzipFile(fileobj=compressed) as decompressed:
                    return decompressed.read().decode("utf-8")
        except gzip.BadGzipFile:
            print("Warning: Response is not actually gzipped despite the header.")
            return response.text  # Return raw text instead

    # If not gzip, return the response as-is
    return response.text

def store_product_ids_in_db(db: Session, product_ids):
    total_added = 0

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

    return total_added

# Run the function
fetch_and_store_product_ids()
