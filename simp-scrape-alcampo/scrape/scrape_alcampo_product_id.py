import time
import re
import uuid
from dotenv import load_dotenv
from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from sqlalchemy.orm import Session
from models import AlcampoProductID
from db.connection import get_db
from schemas.alcampo_productid import AlcampoProductIDSchema  # Import schema

# Load environment variables
load_dotenv()

# List of category URLs to scrape
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

def scrape_alcampo_products():
    """Scrapes product IDs from Alcampo categories and stores them in the database."""

    # Start Selenium WebDriver
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Run in headless mode
    options.add_argument("--disable-gpu")  # Improve stability
    options.add_argument("--window-size=1920,1080")  # Ensure full page loads
    driver = webdriver.Chrome(options=options)

    try:
        for url in CATEGORY_URLS:
            print(f"Opening category: {url}")
            driver.get(url)
            time.sleep(5)  # Wait for initial load

            # Scroll down multiple times to trigger API calls
            for _ in range(10):  # Adjust if needed
                driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
                time.sleep(3)  # Wait for new API calls

            # Capture API Calls
            print(f"Capturing network requests for: {url}")
            for request in driver.requests:
                if "api/v6/products/decorate" in request.url:
                    match = re.search(r"productIds=([\w,-]+)", request.url)
                    if match:
                        ids = match.group(1).split(",")  # Extract product IDs
                        print(ids)
                        store_product_ids_in_db(ids)

    except Exception as e:
        print(f"Error during scraping: {e}")

    finally:
        driver.quit()  # Close the browser

def store_product_ids_in_db(product_ids):
    """Stores the scraped product IDs in the database one by one after each URL."""
    db = get_db()
    total_added = 0

    if not product_ids:
        print("No product IDs found to add.")
        return

    print(f"Attempting to add {len(product_ids)} products to the database...")

    try:
        for product_id in product_ids:
            try:
                valid_product = AlcampoProductIDSchema(src_product_id=uuid.UUID(product_id))  # Validate UUID

                # Check if ID already exists
                exists = db.query(AlcampoProductID).filter_by(src_product_id=valid_product.src_product_id).first()
                if exists:
                    print(f"Product ID already exists in DB: {product_id}")
                    continue

                # Insert new product ID
                new_product = AlcampoProductID(src_product_id=valid_product.src_product_id)
                db.add(new_product)
                db.commit()  # Commit after each insert
                total_added += 1
                print(f"✅ Added new product ID: {product_id}")

            except ValueError:
                print(f"❌ Invalid UUID format: {product_id}")  # Ignore invalid IDs

    except Exception as e:
        print(f"⚠️ Database error: {e}")

    finally:
        db.close()
        print(f"✅ Finished processing. Total new product IDs added: {total_added}")
