# components/scraping/scr_alcampo_product_details.py

import time
import sys
import datetime
import uuid
import os
import re
import json
from decimal import Decimal, InvalidOperation
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
PRODUCT_INFO_CONTAINER_SELECTOR = "div[class*='_grid-item-12_tilop_45']"
BODY_SELECTOR = "body"
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
    if not raw_html: return ""
    text = re.sub(r'', '', raw_html, flags=re.DOTALL)
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = unescape(text)
    return ' '.join(text.split())

def get_or_create_company(db: Session, company_name: str) -> Company | None:
    # (Usually called by main.py, kept here for completeness/testing)
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
    """Gets a product by retail_id or creates it. Does NOT update existing products."""
    retail_id = data.get('retail_id')
    if not retail_id: return None
    try:
        existing_product = db.query(Product).filter(Product.retail_id == retail_id).first()
        if existing_product:
            return existing_product # Return existing, do not update details here
        else:
            # Create only if essential data is present
            spanish_name = data.get('spanish_name')
            if not spanish_name: return None # Cannot create without a name

            product = Product(
                retail_id=retail_id,
                english_name=data.get('english_name', ''), # Default empty string
                spanish_name=spanish_name,
                amount=data.get('amount', Decimal(1)),
                # --- FIX: Provide default 0.00 for weight if not scraped ---
                weight=data.get('weight', Decimal('0.00')),
                 # --- END FIX ---
                measurement=data.get('measurement', 'unit')
            )
            db.add(product); db.commit(); db.refresh(product)
            return product
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"   DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None

def update_or_create_product_company_price(db: Session, product_id: uuid.UUID, company_id: uuid.UUID, price: Decimal | None) -> ProductCompany | None:
    """Updates or creates the price entry in the ProductCompany table."""
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
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (prod_comp {product_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"   DB_ERROR (prod_comp {product_id}): {e}", file=sys.stderr); return None

def mark_link_processed(db: Session, link_id: uuid.UUID):
    """Marks a link as processed by setting the 'details_scraped_at' timestamp."""
    try:
        link = db.query(Alcampo_Product_Link).filter(Alcampo_Product_Link.product_link_id == link_id).first()
        if link and hasattr(link, 'details_scraped_at'):
            link.details_scraped_at = datetime.datetime.now(datetime.timezone.utc); db.commit()
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (mark link {link_id}): {e}", file=sys.stderr)
    except Exception as e: db.rollback(); print(f"   DB_ERROR (mark link {link_id}): {e}", file=sys.stderr)


# components/scraping/scr_alcampo_product_details.py

# ... (Keep imports and other helper functions as they are) ...
# ... (extract_id_from_url, parse_price, parse_unit_string, clean_html_text) ...
# ... (get_or_create_company, save_or_get_product, update_or_create_product_company_price, mark_link_processed) ...


# --- Worker Function ---
def worker_scrape_details(link_url: str, link_id: uuid.UUID, company_id: uuid.UUID, worker_id: int) -> tuple[uuid.UUID, bool]:
    start_time = time.time()
    success = False
    driver = None
    db = None

    scraped_data = {
        'retail_id': None, 'spanish_name': None, 'amount': Decimal(1), 'weight': None, # Default amount=1
        'measurement': 'unit', 'normalized_price': None, 'main_price': None, # Default measurement=unit
        'json_ld_size_parsed': False # Flag to track if size info came from JSON-LD
    }

    try:
        db = SessionLocal()

        # --- WebDriver Setup ---
        options = Options()
        options.add_argument("--no-sandbox"); options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions"); options.add_argument("--disable-gpu")
        # options.add_argument("--headless=new") # Keep commented out for visual debugging if needed
        options.add_argument("--window-size=1920,1080")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
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
        driver.set_page_load_timeout(90)

        # --- Navigation & Basic Wait ---
        driver.get(link_url)
        try: WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, BODY_SELECTOR)))
        except TimeoutException: raise ValueError("Page body did not become present within 30 seconds.")
        time.sleep(3)

        # --- Handle Cookies (Best Effort) ---
        try:
            cookie_button = WebDriverWait(driver, 5).until( EC.element_to_be_clickable((By.CSS_SELECTOR, COOKIE_BUTTON_SELECTOR)) )
            try: cookie_button.click()
            except ElementClickInterceptedException: driver.execute_script("arguments[0].click();", cookie_button)
            time.sleep(0.5)
        except Exception: pass


        # --- Data Extraction ---
        # 1. Attempt JSON-LD First
        product_json = None
        json_ld_size_str = None # Variable to store size string from JSON-LD
        try:
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
                             product_json = potential_product
                             json_ld_size_str = product_json.get('size') # <-- Get size string here
                             break
                    except Exception: continue
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

            # --- NEW: Parse size from JSON-LD if available ---
            if json_ld_size_str and isinstance(json_ld_size_str, str):
                print(f"[Worker {worker_id:02d}] Found JSON-LD size string: {json_ld_size_str}")
                size_match = re.search(r'(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b', json_ld_size_str.lower())
                if size_match:
                    try:
                        num_amount = Decimal(size_match.group(1))
                        unit_measure = size_match.group(2)
                        temp_amount = num_amount
                        temp_unit = 'unit' # Default before conversion

                        if unit_measure in ['g', 'gr']: temp_unit = 'kg'; temp_amount = num_amount / Decimal(1000)
                        elif unit_measure == 'kg': temp_unit = 'kg'; temp_amount = num_amount
                        elif unit_measure == 'ml': temp_unit = 'l'; temp_amount = num_amount / Decimal(1000)
                        elif unit_measure == 'cl': temp_unit = 'l'; temp_amount = num_amount / Decimal(100)
                        elif unit_measure == 'l': temp_unit = 'l'; temp_amount = num_amount

                        # If parsing was successful, update scraped_data
                        if temp_unit != 'unit':
                             scraped_data['amount'] = temp_amount
                             scraped_data['measurement'] = temp_unit
                             scraped_data['json_ld_size_parsed'] = True
                             print(f"[Worker {worker_id:02d}] Parsed size from JSON-LD: {scraped_data['amount']} {scraped_data['measurement']}")

                    except InvalidOperation:
                         print(f"[Worker {worker_id:02d}] WARN: Could not parse number from JSON-LD size '{json_ld_size_str}'.", file=sys.stderr)
            # --- END NEW JSON-LD Size Parsing ---


        # Ensure Retail ID from URL as ultimate fallback
        if not scraped_data.get('retail_id'):
            scraped_data['retail_id'] = extract_id_from_url(link_url)


        # 2. Extract Text Block from Main Container (Still needed for explicit unit price or fallback)
        container_text = ""; container_html = ""; info_container = None
        parsed_amount_text = None; parsed_measurement_text = None; price_per_unit_explicit = None
        try:
            container_wait = WebDriverWait(driver, 30)
            info_container = container_wait.until( EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR)) )
            if info_container:
                 time.sleep(0.5)
                 container_text = info_container.text
                 container_html = info_container.get_attribute('innerHTML')
                 # Parse unit string from text block to get explicit price/unit or text-based units
                 parsed_amount_text, parsed_measurement_text, price_per_unit_explicit = parse_unit_string(container_text)

        except TimeoutException:
             # Only raise error if we *also* failed to get essential data from JSON-LD
             if not scraped_data.get('spanish_name') or scraped_data.get('main_price') is None:
                  page_source_on_fail = driver.page_source; fail_filename = f"failed_link_{link_id}.html"
                  try:
                       with open(fail_filename, "w", encoding="utf-8") as f: f.write(page_source_on_fail)
                       print(f"[Worker {worker_id:02d}] ERROR: Timeout finding container AND JSON-LD incomplete. Saved source to {fail_filename}", file=sys.stderr)
                  except Exception as dump_e: print(f"[Worker {worker_id:02d}] ERROR: Timeout finding container AND JSON-LD incomplete AND failed to dump source: {dump_e}", file=sys.stderr)
                  raise ValueError(f"Product info container not found and JSON-LD incomplete.")
             else:
                  # If we got core data from JSON-LD, maybe log warning but continue
                  print(f"[Worker {worker_id:02d}] WARN: Timeout finding container, but got core data from JSON-LD. Unit/Amount info might be default.", file=sys.stderr)
        except Exception as e: raise ValueError(f"Failed getting info container/text: {e}")


        # 3. Finalize Data (Prioritize JSON-LD size, then text parsing)

        # Use text-parsed amount/measurement ONLY if JSON-LD size wasn't successfully parsed
        if not scraped_data['json_ld_size_parsed']:
             scraped_data['amount'] = parsed_amount_text if parsed_amount_text is not None else Decimal(1)
             scraped_data['measurement'] = parsed_measurement_text if parsed_measurement_text is not None else 'unit'

        # Determine Normalized Price
        # Priority 1: Explicit price/unit found in text block
        if price_per_unit_explicit is not None:
            scraped_data['normalized_price'] = price_per_unit_explicit
            print(f"[Worker {worker_id:02d}] Using explicit price/unit from text: {scraped_data['normalized_price']}")
        # Priority 2: Calculate using main price (ideally from JSON-LD) and determined unit/amount
        elif scraped_data['main_price'] is not None:
            unit = scraped_data['measurement']
            amount = scraped_data['amount']
            try:
                if unit in ['kg', 'l'] and amount > 0: scraped_data['normalized_price'] = scraped_data['main_price'] / amount
                elif unit == 'unit' and amount > 0: scraped_data['normalized_price'] = scraped_data['main_price'] / amount
                elif unit == 'unit' and amount == Decimal(1): scraped_data['normalized_price'] = scraped_data['main_price']
                # else: normalized price remains None if calculation not possible / safe
                if scraped_data['normalized_price'] is not None:
                     print(f"[Worker {worker_id:02d}] Calculated norm price: {scraped_data['normalized_price']} ({scraped_data['main_price']}/{amount} {unit})")
            except Exception as calc_e:
                 print(f"[Worker {worker_id:02d}] WARN: Error calculating normalized price: {calc_e}", file=sys.stderr)


        # --- Final Validation & Database Ops ---
        if not scraped_data.get('retail_id') or not scraped_data.get('spanish_name') or scraped_data.get('normalized_price') is None:
             missing = [k for k, v in scraped_data.items() if (v is None or v=="") and k in ['retail_id', 'spanish_name', 'normalized_price']]
             # Add main_price to missing check if norm_price failed
             if scraped_data.get('normalized_price') is None and scraped_data.get('main_price') is None: missing.append('main_price')
             raise ValueError(f"Missing essential data after all attempts: {', '.join(missing)}")

        saved_product_object = save_or_get_product(db, scraped_data)
        if not saved_product_object: raise ValueError("Failed to save or retrieve Product entry.")

        product_company_entry = update_or_create_product_company_price(
            db=db, product_id=saved_product_object.product_id,
            company_id=company_id, price=scraped_data['normalized_price']
        )
        if not product_company_entry: raise ValueError("Failed to update or create ProductCompany entry.")

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

    return (link_id, success)

# Removed if __name__ == "__main__" block