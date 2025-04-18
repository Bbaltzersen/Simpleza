# components/scraping/scr_alcampo_product_details.py

import time
import sys
import datetime
import uuid
import os
import re
import json
from decimal import Decimal, InvalidOperation
# Used for stripping HTML tags if needed
from html import unescape

# Database Imports
from database.connection import SessionLocal
from models.alcampo_product_link import Alcampo_Product_Link
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, TimeoutException, WebDriverException, ElementClickInterceptedException
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


# --- Configuration ---
CHROMEDRIVER_PATH = None
USE_SEPARATE_PROFILES = True
PROFILE_BASE_DIR = "./chrome_profiles_details"
TARGET_COMPANY_NAME = "Alcampo"


# --- Selectors ---
# Selector for the main container holding product info
# This needs to be present for the text extraction strategy
PRODUCT_INFO_CONTAINER_SELECTOR = "div[class*='_grid-item-12_tilop_45']"
COOKIE_BUTTON_SELECTOR = "#onetrust-accept-btn-handler"


# --- Helper Functions ---
def extract_id_from_url(url: str) -> int | None:
    match = re.search(r'/(\d+)$', url)
    if match:
        try: return int(match.group(1))
        except ValueError: return None
    return None

def parse_price(price_str: str | None) -> Decimal | None:
    if not price_str: return None
    cleaned_price = re.sub(r'[^\d,]+', '', price_str).replace(',', '.')
    try:
        if not cleaned_price: return None
        return Decimal(cleaned_price)
    except InvalidOperation: return None

def parse_unit_string(unit_str: str | None) -> tuple[Decimal | None, str | None, Decimal | None]:
    # (Keep existing function - it uses regex effectively on the unit string)
    if not unit_str: return Decimal(1), 'unit', None
    amount = Decimal(1); unit = 'unit'; price_per = None
    unit_str_lower = unit_str.lower().replace(',', '.')
    price_match = re.search(r'(\d+\.?\d*)\s*€\s*(?:por|/)\s*(kilogramo|kg|litro|l|unidad|ud)', unit_str_lower)
    if price_match:
        try:
            price_per = Decimal(price_match.group(1))
            unit_found = price_match.group(2)
            if unit_found in ['kilogramo', 'kg']: unit = 'kg'; amount = Decimal(1)
            elif unit_found in ['litro', 'l']: unit = 'l'; amount = Decimal(1)
            elif unit_found in ['unidad', 'ud']: unit = 'unit'; amount = Decimal(1)
        except InvalidOperation: price_per = None
    pack_match = re.search(r'(?:pack|paquete)?\s*(\d+)\s*(?:x\s*(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b|uds?\b)', unit_str_lower)
    if pack_match and unit == 'unit':
        pack_count = int(pack_match.group(1))
        if pack_match.group(4) in ['uds', 'ud']: unit = 'unit'; amount = Decimal(pack_count)
        elif pack_match.group(2):
             item_amount_str = pack_match.group(2); item_unit_str = pack_match.group(3)
             try:
                 item_amount = Decimal(item_amount_str); total_amount = Decimal(pack_count) * item_amount
                 if item_unit_str in ['g', 'gr']: unit = 'kg'; amount = total_amount / Decimal(1000)
                 elif item_unit_str == 'kg': unit = 'kg'; amount = total_amount
                 elif item_unit_str == 'ml': unit = 'l'; amount = total_amount / Decimal(1000)
                 elif item_unit_str == 'cl': unit = 'l'; amount = total_amount / Decimal(100)
                 elif item_unit_str == 'l': unit = 'l'; amount = total_amount
                 else: unit = 'unit'; amount = Decimal(pack_count)
             except InvalidOperation: amount = Decimal(pack_count); unit = 'unit'
    elif unit == 'unit':
        simple_amount_match = re.search(r'(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b', unit_str_lower)
        if simple_amount_match:
            try:
                num_amount = Decimal(simple_amount_match.group(1)); unit_measure = simple_amount_match.group(2)
                if unit_measure in ['g', 'gr']: unit = 'kg'; amount = num_amount / Decimal(1000)
                elif unit_measure == 'kg': unit = 'kg'; amount = num_amount
                elif unit_measure == 'ml': unit = 'l'; amount = num_amount / Decimal(1000)
                elif unit_measure == 'cl': unit = 'l'; amount = num_amount / Decimal(100)
                elif unit_measure == 'l': unit = 'l'; amount = num_amount
            except InvalidOperation: amount = Decimal(1); unit = 'unit'
    if unit == 'unit' and not pack_match: amount = Decimal(1)
    return amount, unit, price_per

def clean_html_text(raw_html: str) -> str:
    """Removes HTML tags and decodes HTML entities."""
    if not raw_html: return ""
    # Remove comments first
    text = re.sub(r'', '', raw_html, flags=re.DOTALL)
    # Remove script and style blocks
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Remove all other tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode HTML entities (like &nbsp;) and normalize whitespace
    text = unescape(text)
    return ' '.join(text.split())

# --- Database Functions (Keep existing, ensure they handle None gracefully) ---
def get_or_create_company(db: Session, company_name: str) -> Company | None:
    company = db.query(Company).filter(Company.name == company_name).first()
    if company: return company
    else:
        try:
            new_company = Company(name=company_name); db.add(new_company); db.commit(); db.refresh(new_company)
            return new_company
        except IntegrityError: db.rollback(); return db.query(Company).filter(Company.name == company_name).first()
        except SQLAlchemyError as e: db.rollback(); print(f"DB_ERROR: SQLAlchemyError creating company '{company_name}': {e}", file=sys.stderr); return None
        except Exception as e: db.rollback(); print(f"DB_ERROR: Unexpected error creating company '{company_name}': {e}", file=sys.stderr); return None

def save_or_get_product(db: Session, data: dict) -> Product | None:
    retail_id = data.get('retail_id')
    if not retail_id: return None
    try:
        existing_product = db.query(Product).filter(Product.retail_id == retail_id).first()
        if existing_product:
            return existing_product # Get only
        else:
            spanish_name = data.get('spanish_name')
            if not spanish_name: return None
            product = Product(
                retail_id=retail_id, english_name=None, spanish_name=spanish_name,
                amount=data.get('amount', Decimal(1)), weight=data.get('weight'),
                measurement=data.get('measurement', 'unit')
            )
            db.add(product); db.commit(); db.refresh(product)
            return product
    except SQLAlchemyError as e: db.rollback(); print(f"DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None

def update_or_create_product_company_price(db: Session, product_id: uuid.UUID, company_id: uuid.UUID, price: Decimal | None) -> ProductCompany | None:
    if price is None: return None
    try:
        pc = db.query(ProductCompany).filter(ProductCompany.product_id == product_id, ProductCompany.company_id == company_id).first()
        if pc:
            if pc.price != price: pc.price = price; db.commit(); db.refresh(pc)
            return pc
        else:
            new_pc = ProductCompany(product_id=product_id, company_id=company_id, price=price)
            db.add(new_pc); db.commit(); db.refresh(new_pc)
            return new_pc
    except SQLAlchemyError as e: db.rollback(); print(f"DB_ERROR (prod_comp {product_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"DB_ERROR (prod_comp {product_id}): {e}", file=sys.stderr); return None

def mark_link_processed(db: Session, link_id: uuid.UUID):
    try:
        link = db.query(Alcampo_Product_Link).filter(Alcampo_Product_Link.product_link_id == link_id).first()
        if link and hasattr(link, 'details_scraped_at'):
            link.details_scraped_at = datetime.datetime.now(datetime.timezone.utc); db.commit()
    except SQLAlchemyError as e: db.rollback(); print(f"DB_ERROR (mark link {link_id}): {e}", file=sys.stderr)
    except Exception as e: db.rollback(); print(f"DB_ERROR (mark link {link_id}): {e}", file=sys.stderr)


# --- Worker Function ---
def worker_scrape_details(link_url: str, link_id: uuid.UUID, company_id: uuid.UUID, worker_id: int) -> tuple[uuid.UUID, bool]:
    start_time = time.time()
    success = False
    driver = None
    db = None

    scraped_data = {
        'retail_id': None, 'spanish_name': None, 'amount': Decimal(1), 'weight': None,
        'measurement': 'unit', 'normalized_price': None, 'main_price': None
    }

    try:
        db = SessionLocal()

        # --- WebDriver Setup ---
        options = Options()
        options.add_argument("--no-sandbox"); options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions"); options.add_argument("--disable-gpu")
        options.add_argument("--headless=new"); options.add_argument("--window-size=1920,1080")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        # Optimization: Disable images
        options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})
        options.add_argument("--blink-settings=imagesEnabled=false")

        if USE_SEPARATE_PROFILES:
            profile_path = os.path.abspath(os.path.join(PROFILE_BASE_DIR, f"profile_detail_{worker_id}"))
            os.makedirs(profile_path, exist_ok=True)
            options.add_argument(f"--user-data-dir={profile_path}")

        service = None
        if CHROMEDRIVER_PATH and os.path.exists(CHROMEDRIVER_PATH):
            service = Service(executable_path=CHROMEDRIVER_PATH)

        driver = webdriver.Chrome(service=service, options=options)
        driver.set_page_load_timeout(60)

        # --- Navigation & Cookie Handling ---
        driver.get(link_url)
        try: # Best effort cookie handling
            cookie_button = WebDriverWait(driver, 5).until( EC.element_to_be_clickable((By.CSS_SELECTOR, COOKIE_BUTTON_SELECTOR)) )
            try: cookie_button.click()
            except ElementClickInterceptedException: driver.execute_script("arguments[0].click();", cookie_button)
            time.sleep(0.5)
        except Exception: pass


        # --- Data Extraction ---
        # 1. Attempt JSON-LD First (Most Reliable)
        product_json = None
        try:
            WebDriverWait(driver, 5).until(lambda d: d.execute_script('return document.readyState') == 'complete')
            script_elements = driver.find_elements(By.XPATH, '//script[@type="application/ld+json"]')
            for script in script_elements:
                script_html = script.get_attribute('innerHTML')
                if script_html:
                    try:
                        data = json.loads(script_html)
                        potential_product = None
                        if isinstance(data, dict) and data.get('@type') == 'Product': potential_product = data
                        elif isinstance(data, list):
                            for item in data:
                                 if isinstance(item, dict) and item.get('@type') == 'Product': potential_product = item; break
                        elif isinstance(data, dict) and data.get('@type') == 'ItemPage':
                             main_entity = data.get('mainEntity')
                             if isinstance(main_entity, dict) and main_entity.get('@type') == 'Product': potential_product = main_entity
                        if potential_product and potential_product.get('name'):
                             product_json = potential_product; break
                    except Exception: continue # Ignore script parsing errors
        except Exception as e: print(f"[Worker {worker_id:02d}] WARN: Error searching/parsing JSON-LD: {e}", file=sys.stderr)

        # Populate from JSON-LD if found
        if product_json:
            scraped_data['spanish_name'] = product_json.get('name')
            scraped_data['retail_id'] = product_json.get('sku') or product_json.get('productID')
            offers = product_json.get('offers')
            if isinstance(offers, list): offers = offers[0]
            if isinstance(offers, dict):
                price_str = offers.get('price')
                if price_str is not None:
                     try: scraped_data['main_price'] = Decimal(str(price_str))
                     except InvalidOperation: pass

        # Ensure Retail ID from URL as ultimate fallback
        if not scraped_data.get('retail_id'):
            scraped_data['retail_id'] = extract_id_from_url(link_url)

        # 2. Extract Text Block from Main Container (for fallback/supplement)
        container_text = ""
        container_html = ""
        try:
            # Wait for the container to be present
            info_container = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR))
            )
            # Get text and innerHTML once
            container_text = info_container.text
            container_html = info_container.get_attribute('innerHTML') # For regex on H1

        except TimeoutException:
             print(f"[Worker {worker_id:02d}] ERROR: Timeout finding product info container ({PRODUCT_INFO_CONTAINER_SELECTOR}). Cannot proceed.", file=sys.stderr)
             raise ValueError("Product info container not found") # Raise to fail this worker
        except Exception as e:
             print(f"[Worker {worker_id:02d}] ERROR: Failed getting product info container: {e}", file=sys.stderr)
             raise ValueError(f"Failed getting info container: {e}")

        # 3. Parse from Text Block if needed

        # Name: Try Regex on HTML first if JSON-LD failed
        if not scraped_data.get('spanish_name') and container_html:
             name_match = re.search(r'<h1.*?>(.*?)</h1>', container_html, re.IGNORECASE | re.DOTALL)
             if name_match:
                 scraped_data['spanish_name'] = clean_html_text(name_match.group(1)) # Clean potential inner tags/entities
                 if not scraped_data['spanish_name']: scraped_data['spanish_name'] = None # Reset if cleaning results in empty

        # Name: Final fallback - first non-empty line of container text (less reliable)
        if not scraped_data.get('spanish_name') and container_text:
             lines = container_text.split('\n')
             for line in lines:
                  cleaned_line = line.strip()
                  if cleaned_line:
                       scraped_data['spanish_name'] = cleaned_line
                       print(f"[Worker {worker_id:02d}] Used Fallback (First Line) for Name: {scraped_data['spanish_name']}")
                       break

        # Main Price: Try Regex on container text if JSON-LD failed
        if scraped_data.get('main_price') is None and container_text:
            # Look for price pattern like "1,59 €" maybe followed by "Aprox" near start of lines or after name
            # Prioritize lines containing € but NOT "por kilogramo" etc.
            potential_price_lines = [line for line in container_text.split('\n') if '€' in line and not re.search(r'por |/', line)]
            if potential_price_lines:
                 # Often the price is listed just before or after "Aprox", or stands alone
                 # Try parsing the first likely candidate line
                 main_price_match = re.search(r'(\d+,\d+)\s*€', potential_price_lines[0])
                 if main_price_match:
                      scraped_data['main_price'] = parse_price(main_price_match.group(1))
                      if scraped_data['main_price'] is not None:
                           print(f"[Worker {worker_id:02d}] Used Fallback (Regex on Text) for Price: {scraped_data['main_price']}")

        # Unit String Info (Always try to get this from text block)
        # Use the full container text for parsing unit info
        parsed_amount, parsed_measurement, price_per_unit_explicit = parse_unit_string(container_text)
        scraped_data['amount'] = parsed_amount if parsed_amount is not None else Decimal(1)
        scraped_data['measurement'] = parsed_measurement if parsed_measurement is not None else 'unit'

        # Determine Normalized Price
        if price_per_unit_explicit is not None:
            scraped_data['normalized_price'] = price_per_unit_explicit
        elif scraped_data['main_price'] is not None:
            unit = scraped_data['measurement']; amount = scraped_data['amount']
            if unit in ['kg', 'l'] and amount > 0: scraped_data['normalized_price'] = scraped_data['main_price'] / amount
            elif unit == 'unit' and amount > 0: scraped_data['normalized_price'] = scraped_data['main_price'] / amount
            elif unit == 'unit' and amount == Decimal(1): scraped_data['normalized_price'] = scraped_data['main_price']
            # else: normalized_price remains None

        # --- Final Validation & Database Ops ---
        if not all([scraped_data.get('retail_id'), scraped_data.get('spanish_name'), scraped_data.get('normalized_price') is not None]):
             missing = [k for k, v in scraped_data.items() if (v is None or v=="") and k in ['retail_id', 'spanish_name', 'normalized_price']]
             raise ValueError(f"Missing essential data after all attempts: {', '.join(missing)}")

        saved_product_object = save_or_get_product(db, scraped_data)
        if not saved_product_object: raise ValueError("Failed to save or retrieve Product entry.")

        product_company_entry = update_or_create_product_company_price(
            db=db, product_id=saved_product_object.product_id,
            company_id=company_id, price=scraped_data['normalized_price']
        )
        if not product_company_entry: raise ValueError("Failed to update/create ProductCompany entry.")

        mark_link_processed(db, link_id)
        success = True

    # --- Error Handling & Cleanup ---
    except WebDriverException as e: print(f"[Worker {worker_id:02d}] WebDriver error link {link_id}: {type(e).__name__}", file=sys.stderr)
    except ValueError as e: print(f"[Worker {worker_id:02d}] Processing error link {link_id}: {e}", file=sys.stderr)
    except Exception as e: print(f"[Worker {worker_id:02d}] Unexpected error link {link_id}: {type(e).__name__} - {e}", file=sys.stderr)
    finally:
        if driver: driver.quit()
        if db: db.close()

    duration = time.time() - start_time
    status = "Success" if success else "Failed"
    if not success: print(f"[Worker {worker_id:02d}] Finished Link ID: {link_id} | Status: {status} | Time: {duration:.2f}s | URL: {link_url}")
    # else: print(f"[Worker {worker_id:02d}] Success Link ID: {link_id}") # Optional success log

    return (link_id, success)

# Removed if __name__ == "__main__" block