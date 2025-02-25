import time
import re
import uuid
import os
from dotenv import load_dotenv
from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from sqlalchemy.orm import Session
from models.alcampo_productid import AlcampoProductID
from db.connection import get_db
from schemas.alcampo_productid import AlcampoProductIDSchema

# Load environment variables
load_dotenv()

# Start Selenium WebDriver
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run in headless mode
driver = webdriver.Chrome(options=options)

# Open the webpage
driver.get("https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation")
time.sleep(5)  # Wait for initial load

# Scroll down multiple times to trigger API calls
for _ in range(10):  # Adjust as needed
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
    time.sleep(3)  # Wait for new API calls

# Store unique product IDs
product_ids = set()

# Intercept API Calls
for request in driver.requests:
    if "api/v6/products/decorate" in request.url:
        print(f"Intercepted API Call: {request.url}")
        match = re.search(r"productIds=([\w,-]+)", request.url)
        if match:
            ids = match.group(1).split(",")  # Extract product IDs
            product_ids.update(ids)

driver.quit()  # Close the browser

# Insert Product IDs into the database
db = get_db()

for product_id in product_ids:
    try:
        valid_product = AlcampoProductIDSchema(src_product_id=uuid.UUID(product_id))  # Validate
        exists = db.query(AlcampoProductID).filter_by(src_product_id=valid_product.src_product_id).first()
        if not exists:
            new_product = AlcampoProductID(src_product_id=valid_product.src_product_id)
            db.add(new_product)
    except ValueError:
        print(f"❌ Invalid UUID: {product_id}")  # Ignore invalid IDs

db.commit()
db.close()

print(f"✅ Stored {len(product_ids)} unique product IDs in the database.")
