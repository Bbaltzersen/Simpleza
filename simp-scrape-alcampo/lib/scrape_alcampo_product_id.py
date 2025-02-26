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

    all_product_ids = set()  # Store unique product IDs

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
                        all_product_ids.update(ids)

    except Exception as e:
        print(f"Error during scraping: {e}")

    finally:
        driver.quit()  # Close the browser

    # Insert Product IDs into the Database
    print(f"Total unique product IDs captured: {len(all_product_ids)}")
    store_product_ids_in_db(all_product_ids)

def store_product_ids_in_db(product_ids):
    """Stores the scraped product IDs in the database."""
    db = get_db()
    try:
        new_products = []

        for product_id in product_ids:
            try:
                valid_product = AlcampoProductIDSchema(src_product_id=uuid.UUID(product_id))  # Validate
                exists = db.query(AlcampoProductID).filter_by(src_product_id=valid_product.src_product_id).first()
                if not exists:
                    new_products.append(AlcampoProductID(src_product_id=valid_product.src_product_id))
            except ValueError:
                print(f"Invalid UUID: {product_id}")  # Ignore invalid IDs

        if new_products:
            db.bulk_save_objects(new_products)  # Bulk insert for efficiency
            db.commit()
            print(f"Stored {len(new_products)} new product IDs in the database.")
        else:
            print("No new product IDs to insert.")

    except Exception as e:
        print(f"Database error: {e}")

    finally:
        db.close()
        print("Database connection closed.")

