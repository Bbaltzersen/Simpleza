# components/scraping/scr_alcampo_product_details.py

import time
import sys
import datetime
import uuid
import os
import re
import json
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP # Import ROUND_HALF_UP
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
        # Quantize to 2 decimal places upon parsing
        return Decimal(cleaned_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except InvalidOperation: return None

def parse_unit_string(unit_str: str | None) -> tuple[Decimal | None, str | None, Decimal | None]:
    """
    Parses unit string. Stores g, ml, cl directly. Standardizes gr->g, ud->unit.
    Returns: (parsed_quantity, parsed_unit, explicit_price_per_unit).
    """
    if not unit_str: return Decimal(1), 'unit', None
    # --- Store results of this function ---
    parsed_quantity = Decimal(1)
    parsed_unit = 'unit'
    explicit_price_per = None
    # ---
    unit_str_lower = unit_str.lower().replace(',', '.')

    # Check for explicit price per unit first - this often defines the base unit well
    price_match = re.search(r'(\d+\.?\d*)\s*€\s*(?:por|/)\s*(kilogramo|kg|litro|l|unidad|ud)', unit_str_lower)
    temp_unit_from_ppu = None
    if price_match:
        try:
            explicit_price_per = parse_price(price_match.group(1)) # Use parse_price here
            unit_found = price_match.group(2)
            if unit_found in ['kilogramo', 'kg']: temp_unit_from_ppu = 'kg'
            elif unit_found in ['litro', 'l']: temp_unit_from_ppu = 'l'
            elif unit_found in ['unidad', 'ud']: temp_unit_from_ppu = 'unit'
            if temp_unit_from_ppu:
                 parsed_unit = temp_unit_from_ppu
                 parsed_quantity = Decimal(1)
        except InvalidOperation: explicit_price_per = None


    # Find pack info or simple quantity/unit, only if unit wasn't fixed by explicit price/unit
    if temp_unit_from_ppu is None:
        # Priority on packs (e.g., "pack 6 uds", "6 x 125g")
        pack_match = re.search(r'(?:pack|paquete)?\s*(\d+)\s*(?:x\s*(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b|uds?\b)', unit_str_lower)
        if pack_match:
            pack_count = int(pack_match.group(1))
            if pack_match.group(4) in ['uds', 'ud']:
                parsed_unit = 'unit'
                parsed_quantity = Decimal(pack_count)
            elif pack_match.group(2): # e.g., 6 x 125g
                 item_amount_str = pack_match.group(2); item_unit_str = pack_match.group(3).lower()
                 try:
                     item_amount = Decimal(item_amount_str)
                     total_raw_amount = Decimal(pack_count) * item_amount
                     parsed_quantity = total_raw_amount # Store total amount in its original unit
                     # Store original unit, standardizing 'gr' to 'g'
                     if item_unit_str == 'gr': parsed_unit = 'g'
                     else: parsed_unit = item_unit_str # Keep g, kg, ml, cl, l
                 except InvalidOperation: parsed_unit = 'unit'; parsed_quantity = Decimal(pack_count)

        # Simple amount/unit if not a pack (e.g., "750g", "1.5 l")
        else:
            simple_amount_match = re.search(r'^(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b', unit_str_lower.strip())
            if simple_amount_match:
                try:
                    num_amount = Decimal(simple_amount_match.group(1))
                    unit_measure = simple_amount_match.group(2).lower()
                    parsed_quantity = num_amount # Store amount in its original unit
                    # Store original unit, standardize 'gr' to 'g'
                    if unit_measure == 'gr': parsed_unit = 'g'
                    else: parsed_unit = unit_measure
                except InvalidOperation: parsed_quantity = Decimal(1); parsed_unit = 'unit'
            # If nothing matches, it defaults to amount=1, unit='unit'

    # Final fallback if unit is still 'unit'
    if parsed_unit == 'unit' and not pack_match and temp_unit_from_ppu is None:
        parsed_quantity = Decimal(1)

    # Ensure unit is lowercase
    if parsed_unit: parsed_unit = parsed_unit.lower()

    return parsed_quantity, parsed_unit, explicit_price_per

def clean_html_text(raw_html: str) -> str:
    if not raw_html: return ""
    text = re.sub(r'', '', raw_html, flags=re.DOTALL)
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = unescape(text)
    return ' '.join(text.split())

# --- Database Functions ---
# (Keep get_or_create_company, update_or_create_product_company_price, mark_link_processed as before)
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
    """Gets a product by retail_id or creates it using prepared data. Does NOT update."""
    # Relies on data dict having keys: retail_id, spanish_name, amount, weight, measurement
    # Defaults should be applied *before* calling this function.
    retail_id = data.get('retail_id')
    if not retail_id: return None
    try:
        existing_product = db.query(Product).filter(Product.retail_id == retail_id).first()
        if existing_product:
            return existing_product
        else:
            spanish_name = data.get('spanish_name')
            if not spanish_name: return None # Cannot create without name

            # Create using values prepared by the worker according to new rules
            product = Product(
                retail_id=retail_id,
                english_name=data.get('english_name', ''), # Still default this
                spanish_name=spanish_name,
                amount=data['amount'], # Use pre-calculated amount
                weight=data['weight'], # Use pre-calculated weight
                measurement=data['measurement'] # Use pre-calculated measurement
            )
            # --- Add Debug Print ---
            print(f"DEBUG save_or_get_product: Creating Product - "
                  f"retail_id={product.retail_id}, name='{product.spanish_name}', "
                  f"amount={product.amount}, weight={product.weight}, "
                  f"measurement='{product.measurement}'")
            # --- End Debug Print ---
            db.add(product); db.commit(); db.refresh(product)
            return product
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"   DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None

def update_or_create_product_company_price(db: Session, product_id: uuid.UUID, company_id: uuid.UUID, price: Decimal | None) -> ProductCompany | None:
    if price is None: return None
    try:
        # Quantize price before saving/comparing
        quantized_price = price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        pc = db.query(ProductCompany).filter(ProductCompany.product_id == product_id, ProductCompany.company_id == company_id).first()
        if pc:
            # Compare quantized price
            if pc.price != quantized_price:
                 pc.price = quantized_price; db.commit(); db.refresh(pc)
            return pc
        else:
            new_pc = ProductCompany(product_id=product_id, company_id=company_id, price=quantized_price)
            db.add(new_pc); db.commit(); db.refresh(new_pc)
            return new_pc
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (prod_comp {product_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"   DB_ERROR (prod_comp {product_id}): {e}", file=sys.stderr); return None

def mark_link_processed(db: Session, link_id: uuid.UUID):
    try:
        link = db.query(Alcampo_Product_Link).filter(Alcampo_Product_Link.product_link_id == link_id).first()
        if link and hasattr(link, 'details_scraped_at'):
            link.details_scraped_at = datetime.datetime.now(datetime.timezone.utc); db.commit()
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (mark link {link_id}): {e}", file=sys.stderr)
    except Exception as e: db.rollback(); print(f"   DB_ERROR (mark link {link_id}): {e}", file=sys.stderr)


# --- Worker Function ---
def worker_scrape_details(link_url: str, link_id: uuid.UUID, company_id: uuid.UUID, worker_id: int) -> tuple[uuid.UUID, bool]:
    start_time = time.time()
    success = False
    driver = None
    db = None

    # Temporary storage for directly parsed values
    parsed_data = {
        'retail_id': None, 'spanish_name': None, 'main_price': None,
        'parsed_amount': None, 'parsed_unit': None, 'explicit_ppu': None
    }
    # Final data to be saved according to new rules
    db_product_data = {
        'retail_id': None, 'spanish_name': None, 'amount': Decimal(1), 'weight': Decimal('0.00'),
        'measurement': 'unit'
    }
    normalized_price_for_company = None # Price per kg/l/unit for ProductCompany

    try:
        db = SessionLocal()

        # --- WebDriver Setup ---
        options = Options()
        options.add_argument("--no-sandbox"); options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions"); options.add_argument("--disable-gpu")
        # options.add_argument("--headless=new")
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
        json_ld_size_str = None
        try:
            script_elements = driver.find_elements(By.XPATH, '//script[@type="application/ld+json"]')
            for script in script_elements:
                script_html = script.get_attribute('innerHTML')
                if script_html:
                    try:
                        data = json.loads(script_html)
                        potential_product = None
                        # Find Product dict
                        if isinstance(data, dict) and data.get('@type') == 'Product': potential_product = data
                        elif isinstance(data, list):
                            for item in data:
                                 if isinstance(item, dict) and item.get('@type') == 'Product': potential_product = item; break
                        elif isinstance(data, dict) and data.get('@type') == 'ItemPage':
                             main_entity = data.get('mainEntity')
                             if isinstance(main_entity, dict) and main_entity.get('@type') == 'Product': potential_product = main_entity
                        # Use if found and has name
                        if potential_product and potential_product.get('name'):
                             product_json = potential_product
                             json_ld_size_str = product_json.get('size')
                             break
                    except Exception: continue
        except Exception as e: print(f"[Worker {worker_id:02d}] WARN: Error searching/parsing JSON-LD: {e}", file=sys.stderr)

        # Populate intermediate data from JSON-LD if found
        if product_json:
            parsed_data['spanish_name'] = product_json.get('name')
            parsed_data['retail_id'] = product_json.get('sku') or product_json.get('productID')
            offers = product_json.get('offers')
            if isinstance(offers, list): offers = offers[0]
            if isinstance(offers, dict):
                price_str = offers.get('price')
                if price_str is not None: parsed_data['main_price'] = parse_price(str(price_str))

            # Try parsing size string from JSON-LD into amount/unit
            if json_ld_size_str and isinstance(json_ld_size_str, str):
                temp_amount, temp_unit, _ = parse_unit_string(json_ld_size_str)
                if temp_unit and temp_unit != 'unit': # Check if parsing found a specific unit
                     parsed_data['parsed_amount'] = temp_amount
                     parsed_data['parsed_unit'] = temp_unit


        # Ensure Retail ID from URL as ultimate fallback
        if not parsed_data.get('retail_id'):
            parsed_data['retail_id'] = extract_id_from_url(link_url)


        # 2. Extract Text Block from Main Container (needed for explicit PPU / fallback)
        container_text = ""; container_html = ""
        parsed_amount_text = None; parsed_unit_text = None; explicit_ppu_text = None
        try:
            container_wait = WebDriverWait(driver, 30)
            info_container = container_wait.until( EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR)) )
            if info_container:
                 time.sleep(0.5)
                 container_text = info_container.text
                 container_html = info_container.get_attribute('innerHTML')
                 # Parse the whole text block using the helper
                 parsed_amount_text, parsed_unit_text, explicit_ppu_text = parse_unit_string(container_text)

        except TimeoutException:
             if not parsed_data.get('spanish_name') or parsed_data.get('main_price') is None:
                  page_source_on_fail = driver.page_source; fail_filename = f"failed_link_{link_id}.html"
                  try:
                       with open(fail_filename, "w", encoding="utf-8") as f: f.write(page_source_on_fail)
                       print(f"[Worker {worker_id:02d}] ERROR: Timeout finding container AND JSON-LD incomplete. Saved source to {fail_filename}", file=sys.stderr)
                  except Exception as dump_e: print(f"[Worker {worker_id:02d}] ERROR: Timeout finding container AND JSON-LD incomplete AND failed to dump source: {dump_e}", file=sys.stderr)
                  raise ValueError(f"Product info container not found and JSON-LD incomplete.")
             else: print(f"[Worker {worker_id:02d}] WARN: Timeout finding container, using JSON-LD data.", file=sys.stderr)
        except Exception as e: raise ValueError(f"Failed getting info container/text: {e}")


        # 3. Finalize Data

        # Finalize Name: JSON-LD > HTML Regex > First Line Fallback
        if not parsed_data.get('spanish_name') and container_html:
             name_match = re.search(r'<h1.*?>(.*?)</h1>', container_html, re.IGNORECASE | re.DOTALL)
             if name_match:
                 cleaned_name = clean_html_text(name_match.group(1))
                 if cleaned_name: parsed_data['spanish_name'] = cleaned_name
        if not parsed_data.get('spanish_name') and container_text:
             lines = container_text.split('\n');
             for line in lines:
                  cleaned_line = line.strip()
                  if cleaned_line: parsed_data['spanish_name'] = cleaned_line; break

        # Finalize Main Price: Use JSON-LD if available, else text regex fallback
        if parsed_data.get('main_price') is None and container_text:
            potential_price_lines = [line for line in container_text.split('\n') if '€' in line and not re.search(r'por |/', line, re.IGNORECASE)]
            if potential_price_lines:
                 main_price_match = re.search(r'(\d+,\d+)\s*€', potential_price_lines[0])
                 if main_price_match: parsed_data['main_price'] = parse_price(main_price_match.group(1))

        # Finalize Amount/Unit: Prioritize JSON-LD parsed, then text parsed
        if parsed_data.get('parsed_unit') is None: # If JSON-LD size parsing failed or wasn't attempted
             parsed_data['parsed_amount'] = parsed_amount_text
             parsed_data['parsed_unit'] = parsed_unit_text

        # Ensure defaults if still None after all attempts
        if parsed_data.get('parsed_amount') is None: parsed_data['parsed_amount'] = Decimal(1)
        if parsed_data.get('parsed_unit') is None: parsed_data['parsed_unit'] = 'unit'


        # 4. Determine Normalized Price (for ProductCompany)
        # Must use the *parsed* amount/unit *before* applying user's storage rules
        temp_norm_price = None
        if explicit_ppu_text is not None:
             temp_norm_price = explicit_ppu_text # Use explicitly found price/unit
        elif parsed_data['main_price'] is not None:
            calc_unit = parsed_data['parsed_unit']; calc_amount = parsed_data['parsed_amount']
            try:
                if calc_unit in ['kg', 'l'] and calc_amount > 0: temp_norm_price = parsed_data['main_price'] / calc_amount
                elif calc_unit == 'g' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 1000
                elif calc_unit == 'gr' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 1000 # Treat gr as g
                elif calc_unit == 'ml' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 1000
                elif calc_unit == 'cl' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 100
                elif calc_unit == 'unit' and calc_amount > 0: temp_norm_price = parsed_data['main_price'] / calc_amount
                # Quantize here after calculation
                if temp_norm_price is not None:
                     normalized_price_for_company = temp_norm_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            except Exception as calc_e: print(f"[Worker {worker_id:02d}] WARN: Error calculating normalized price: {calc_e}", file=sys.stderr)


        # 5. Prepare data for Product table according to NEW rules
        db_product_data['retail_id'] = parsed_data['retail_id']
        db_product_data['spanish_name'] = parsed_data['spanish_name']

        final_parsed_unit = parsed_data['parsed_unit']
        final_parsed_amount = parsed_data['parsed_amount']

        if final_parsed_unit == 'unit':
             db_product_data['amount'] = final_parsed_amount
             db_product_data['measurement'] = 'unit'
             db_product_data['weight'] = Decimal('0.00') # Default weight for unit items
        elif final_parsed_unit in ['g', 'gr', 'kg', 'ml', 'cl', 'l']:
             db_product_data['amount'] = Decimal('1') # Amount is always 1 for weight/volume items per request
             db_product_data['measurement'] = 'g' if final_parsed_unit == 'gr' else final_parsed_unit # Store g, kg, ml, cl, l
             db_product_data['weight'] = final_parsed_amount # Store the numeric quantity in weight column
        else: # Fallback / Unknown
             db_product_data['amount'] = Decimal('1')
             db_product_data['measurement'] = 'unit'
             db_product_data['weight'] = Decimal('0.00')


        # --- Final Validation & Database Ops ---
        if not all([db_product_data.get('retail_id'), db_product_data.get('spanish_name'), normalized_price_for_company is not None]):
             missing = [k for k, v in db_product_data.items() if (v is None or v=="") and k in ['retail_id', 'spanish_name']]
             if normalized_price_for_company is None: missing.append('normalized_price')
             raise ValueError(f"Missing essential data before DB save: {', '.join(missing)}")

        saved_product_object = save_or_get_product(db, db_product_data) # Pass the rearranged data
        if not saved_product_object: raise ValueError("Failed to save or retrieve Product entry.")

        product_company_entry = update_or_create_product_company_price(
            db=db, product_id=saved_product_object.product_id,
            company_id=company_id, price=normalized_price_for_company # Save the normalized price/kg/l/unit
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