# components/scraping/scr_alcampo_product_details.py

import time
import sys
import datetime
import uuid
import os
import re
import json
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from html import unescape

# Database Imports
from database.connection import SessionLocal
from models.alcampo_product_link import Alcampo_Product_Link
from models.product import Product # Ensure Product model is updated with new columns
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
PRODUCT_INFO_CONTAINER_SELECTOR = "div[class*='_grid-item-12_tilop_45']" # For fallback name/price
BODY_SELECTOR = "body"
COOKIE_BUTTON_SELECTOR = "#onetrust-accept-btn-handler"
# --- NEW: Specific selector for the size/unit text ---
SIZE_UNIT_CONTAINER_SELECTOR = "div[data-test='size-container']"
# --- Fallback selectors ---
NAME_SELECTOR_FALLBACK = "div[class*='_grid-item-12_tilop_45'] h1"
PRICE_CONTAINER_SELECTOR = "div[data-test='price-container']"
PRICE_SELECTOR_INSIDE_CONTAINER_FALLBACK = "span[class*='_display']"


# --- Helper Functions (Keep all previous helpers: extract_id_from_url, parse_price, parse_unit_string, clean_html_text, get_or_create_company, save_or_get_product, update_or_create_product_company_price, mark_link_processed) ---
def extract_id_from_url(url: str) -> str | None:
    match = re.search(r'/(\d+)$', url)
    if match: return match.group(1)
    return None

def parse_price(price_str: str | None) -> Decimal | None:
    if not price_str: return None
    cleaned_price = re.sub(r'[^\d,.]+', '', price_str).replace(',', '.')
    if cleaned_price.count('.') > 1: parts = cleaned_price.split('.'); cleaned_price = parts[0] + '.' + "".join(parts[1:])
    try:
        if not cleaned_price: return None
        return Decimal(cleaned_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except InvalidOperation: return None

def parse_unit_string(unit_str: str | None) -> tuple[Decimal | None, str | None, Decimal | None]:
    if not unit_str: return Decimal(1), 'unit', None
    parsed_quantity = Decimal(1); parsed_unit = 'unit'; explicit_price_per = None
    unit_str_lower = unit_str.lower() # Keep comma for price parsing

    ppu_pattern1 = r'(\d{1,3}(?:[.,]\d{1,2})?)\s*€\s*(?:/|por)\s+(kilogramo|kg|litro|l|unidad|ud)\b'
    ppu_pattern2 = r'(\d{1,3}(?:[.,]\d{1,2})?)\s*€\s*/\s*(kg|kilogramo|l|litro|ud|unidad)\b'
    ppu_pattern3 = r'price\s+per\s+(?:approx\.\s+)?(kg|kilogram|litre|liter|unit)\s*:\s*€\s*(\d{1,3}(?:[.,]\d{1,2})?)'

    temp_unit_from_ppu = None
    # Match on lowercased string, replacing comma just for number part if needed
    price_match = re.search(ppu_pattern1, unit_str_lower.replace(',', '.')) or \
                  re.search(ppu_pattern2, unit_str_lower.replace(',', '.')) or \
                  re.search(ppu_pattern3, unit_str_lower.replace(',', '.'))

    if price_match:
        try:
            if price_match.re.pattern == ppu_pattern3: price_str_in_match = price_match.group(2); unit_found = price_match.group(1)
            else: price_str_in_match = price_match.group(1); unit_found = price_match.group(2)

            explicit_price_per = parse_price(price_str_in_match) # Use robust parse_price

            if explicit_price_per is not None:
                 if unit_found in ['kilogramo', 'kg', 'kilogram']: temp_unit_from_ppu = 'kg'
                 elif unit_found in ['litro', 'l', 'litre', 'liter']: temp_unit_from_ppu = 'l'
                 elif unit_found in ['unidad', 'ud', 'unit']: temp_unit_from_ppu = 'unit'
                 if temp_unit_from_ppu: parsed_unit = temp_unit_from_ppu; parsed_quantity = Decimal(1)
                 # print(f"DEBUG parse_unit_string: Found PPU Match - Price={explicit_price_per}, Unit={parsed_unit}")
        except Exception as e: print(f"DEBUG parse_unit_string: Error parsing PPU - {e}")

    if temp_unit_from_ppu is None:
        pack_match = re.search(r'(?:pack|paquete)?\s*(\d+)\s*(?:x\s*(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b|uds?\b)', unit_str_lower)
        if pack_match:
            pack_count = int(pack_match.group(1))
            if pack_match.group(4) in ['uds', 'ud']: parsed_unit = 'unit'; parsed_quantity = Decimal(pack_count)
            elif pack_match.group(2):
                 item_amount_str = pack_match.group(2); item_unit_str = pack_match.group(3).lower()
                 try:
                     item_amount = Decimal(item_amount_str); total_raw_amount = Decimal(pack_count) * item_amount
                     parsed_quantity = total_raw_amount
                     if item_unit_str == 'gr': parsed_unit = 'g'
                     else: parsed_unit = item_unit_str
                 except InvalidOperation: parsed_unit = 'unit'; parsed_quantity = Decimal(pack_count)
        else:
            simple_amount_match = re.search(r'(?:^|\s|aprox|approx)\s*(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b', unit_str_lower)
            if simple_amount_match:
                try:
                    num_amount = Decimal(simple_amount_match.group(1)); unit_measure = simple_amount_match.group(2).lower()
                    parsed_quantity = num_amount
                    if unit_measure == 'gr': parsed_unit = 'g'
                    else: parsed_unit = unit_measure
                except InvalidOperation: parsed_quantity = Decimal(1); parsed_unit = 'unit'

    if parsed_unit == 'unit' and not pack_match and temp_unit_from_ppu is None: parsed_quantity = Decimal(1)
    if parsed_unit: parsed_unit = parsed_unit.lower()
    return parsed_quantity, parsed_unit, explicit_price_per

def clean_html_text(raw_html: str) -> str:
    if not raw_html: return ""
    text = re.sub(r'', '', raw_html, flags=re.DOTALL)
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = unescape(text)
    return ' '.join(text.split())

def get_or_create_company(db: Session, company_name: str) -> Company | None:
    company = db.query(Company).filter(Company.name == company_name).first()
    if company: return company
    else:
        try: new_company = Company(name=company_name); db.add(new_company); db.commit(); db.refresh(new_company); return new_company
        except IntegrityError: db.rollback(); return db.query(Company).filter(Company.name == company_name).first()
        except SQLAlchemyError as e: db.rollback(); print(f"DB_ERROR: SQLAlchemyError creating company '{company_name}': {e}", file=sys.stderr); return None
        except Exception as e: db.rollback(); print(f"DB_ERROR: Unexpected error creating company '{company_name}': {e}", file=sys.stderr); return None

def save_or_get_product(db: Session, data: dict) -> Product | None:
    retail_id = data.get('retail_id')
    if not retail_id: return None
    try:
        existing_product = db.query(Product).filter(Product.retail_id == retail_id).first()
        if existing_product: return existing_product
        else:
            spanish_name = data.get('spanish_name')
            if not spanish_name: return None
            product = Product(
                retail_id=retail_id, english_name=data.get('english_name', ''), spanish_name=spanish_name,
                amount=data['amount'], weight=data.get('weight', Decimal('0.00')), measurement=data['measurement'],
                min_weight_g=data.get('min_weight_g'), max_weight_g=data.get('max_weight_g')
            )
            print(f"DEBUG save_or_get_product: Creating Product - "
                  f"retail_id={product.retail_id}, name='{product.spanish_name}', "
                  f"amount={product.amount}, weight={product.weight}, measurement='{product.measurement}', "
                  f"min_weight={product.min_weight_g}, max_weight={product.max_weight_g}")
            db.add(product); db.commit(); db.refresh(product)
            return product
    except SQLAlchemyError as e: db.rollback(); print(f"   DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None
    except Exception as e: db.rollback(); print(f"   DB_ERROR (prod {retail_id}): {e}", file=sys.stderr); return None

def update_or_create_product_company_price(db: Session, product_id: uuid.UUID, company_id: uuid.UUID, price: Decimal | None) -> ProductCompany | None:
    if price is None: return None
    try:
        quantized_price = price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        pc = db.query(ProductCompany).filter(ProductCompany.product_id == product_id, ProductCompany.company_id == company_id).first()
        if pc:
            if pc.price != quantized_price: pc.price = quantized_price; db.commit(); db.refresh(pc)
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

    parsed_data = {
        'retail_id': None, 'spanish_name': None, 'main_price': None,
        'parsed_amount': None, 'parsed_unit': None, 'explicit_ppu': None,
        'min_weight_g': None, 'max_weight_g': None
    }
    db_product_data = {
        'retail_id': None, 'spanish_name': None, 'amount': Decimal(1), 'weight': Decimal('0.00'),
        'measurement': 'unit', 'min_weight_g': None, 'max_weight_g': None
    }
    normalized_price_for_company = None

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
                        if isinstance(data, dict) and data.get('@type') == 'Product': potential_product = data
                        elif isinstance(data, list):
                            for item in data:
                                 if isinstance(item, dict) and item.get('@type') == 'Product': potential_product = item; break
                        elif isinstance(data, dict) and data.get('@type') == 'ItemPage':
                             main_entity = data.get('mainEntity')
                             if isinstance(main_entity, dict) and main_entity.get('@type') == 'Product': potential_product = main_entity
                        if potential_product and potential_product.get('name'):
                             product_json = potential_product
                             json_ld_size_str = product_json.get('size'); break
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
                if temp_unit and temp_unit != 'unit':
                     parsed_data['parsed_amount'] = temp_amount
                     parsed_data['parsed_unit'] = temp_unit

        # Ensure Retail ID from URL as ultimate fallback
        if not parsed_data.get('retail_id'):
            parsed_data['retail_id'] = extract_id_from_url(link_url)


        # 2. Extract Specific Texts and Fallbacks
        size_container_text = ""
        explicit_ppu_text = None
        parsed_amount_text = None
        parsed_unit_text = None
        container_html_for_fallback = "" # Only get if needed for name fallback

        # --- NEW: Targeted extraction for size/unit info ---
        try:
            size_container_wait = WebDriverWait(driver, 15) # Wait specifically for this
            size_container = size_container_wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, SIZE_UNIT_CONTAINER_SELECTOR))
            )
            if size_container:
                size_container_text = size_container.text
                print(f"DEBUG worker_scrape_details: Size Container Text (Link ID: {link_id}):\n>>>\n{size_container_text}\n<<<")
                # Parse this specific text
                parsed_amount_text, parsed_unit_text, explicit_ppu_text = parse_unit_string(size_container_text)
        except TimeoutException:
             print(f"[Worker {worker_id:02d}] WARN: Timeout finding size container ({SIZE_UNIT_CONTAINER_SELECTOR}). Unit info might be inaccurate.", file=sys.stderr)
        except Exception as e:
             print(f"[Worker {worker_id:02d}] WARN: Error finding/parsing size container: {e}", file=sys.stderr)
        # --- END NEW: Targeted extraction ---


        # Finalize Name (Fallback using main container HTML or text if needed)
        if not parsed_data.get('spanish_name'):
            try:
                # Only get container HTML if name fallback is truly needed
                container_wait = WebDriverWait(driver, 5) # Short wait ok, main structure likely loaded
                info_container = container_wait.until( EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR)) )
                container_html_for_fallback = info_container.get_attribute('innerHTML')
                container_text_for_fallback = info_container.text

                name_match = re.search(r'<h1.*?>(.*?)</h1>', container_html_for_fallback, re.IGNORECASE | re.DOTALL)
                if name_match:
                    cleaned_name = clean_html_text(name_match.group(1))
                    if cleaned_name: parsed_data['spanish_name'] = cleaned_name
                if not parsed_data.get('spanish_name') and container_text_for_fallback:
                     lines = container_text_for_fallback.split('\n');
                     for line in lines:
                          cleaned_line = line.strip()
                          if cleaned_line: parsed_data['spanish_name'] = cleaned_line; break
            except Exception as e: print(f"[Worker {worker_id:02d}] WARN: Name fallback failed: {e}", file=sys.stderr)


        # Finalize Main Price (Fallback using main container text if needed)
        if parsed_data.get('main_price') is None:
             try:
                 # Only get container text if price fallback needed and not already fetched
                 if not container_text: # Avoid redundant fetching if size container failed but main container might exist
                     container_wait = WebDriverWait(driver, 5)
                     info_container = container_wait.until( EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR)) )
                     container_text = info_container.text

                 if container_text:
                    potential_price_lines = [line for line in container_text.split('\n') if '€' in line and not re.search(r'por |/', line, re.IGNORECASE)]
                    if potential_price_lines:
                         main_price_match = re.search(r'(\d+,\d+)\s*€', potential_price_lines[0])
                         if main_price_match: parsed_data['main_price'] = parse_price(main_price_match.group(1))
             except Exception as e: print(f"[Worker {worker_id:02d}] WARN: Price fallback failed: {e}", file=sys.stderr)


        # Finalize Amount/Unit: Prioritize JSON-LD parsed, then text parsed from size_container
        if parsed_data.get('parsed_unit') is None: # If JSON-LD size parsing failed or wasn't attempted
             parsed_data['parsed_amount'] = parsed_amount_text
             parsed_data['parsed_unit'] = parsed_unit_text

        # Ensure defaults if still None after all attempts
        if parsed_data.get('parsed_amount') is None: parsed_data['parsed_amount'] = Decimal(1)
        if parsed_data.get('parsed_unit') is None: parsed_data['parsed_unit'] = 'unit'


        # Extract Weight Range (Use full container text if available)
        if container_text: # Use text from main container if fetched
             range_match = re.search(r'Rango de peso:\s*(\d+)\s*g\s*-\s*(\d+)\s*g', container_text, re.IGNORECASE)
             if range_match:
                  try:
                       parsed_data['min_weight_g'] = int(range_match.group(1))
                       parsed_data['max_weight_g'] = int(range_match.group(2))
                  except ValueError: pass # Ignore if numbers invalid


        # 4. Determine Normalized Price (for ProductCompany)
        temp_norm_price = None
        # Priority 1: Explicit price/unit found in size_container_text
        if explicit_ppu_text is not None:
             temp_norm_price = explicit_ppu_text
        # Priority 2: Calculate using main price and determined unit/amount
        elif parsed_data['main_price'] is not None:
            calc_unit = parsed_data['parsed_unit']; calc_amount = parsed_data['parsed_amount']
            try:
                if calc_unit == 'kg' and calc_amount > 0: temp_norm_price = parsed_data['main_price'] / calc_amount
                elif calc_unit == 'l' and calc_amount > 0: temp_norm_price = parsed_data['main_price'] / calc_amount
                elif calc_unit == 'g' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 1000
                elif calc_unit == 'gr' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 1000
                elif calc_unit == 'ml' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 1000
                elif calc_unit == 'cl' and calc_amount > 0: temp_norm_price = (parsed_data['main_price'] / calc_amount) * 100
                elif calc_unit == 'unit' and calc_amount > 0: temp_norm_price = parsed_data['main_price'] / calc_amount
                if temp_norm_price is not None:
                     normalized_price_for_company = temp_norm_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            except Exception as calc_e: print(f"[Worker {worker_id:02d}] WARN: Error calculating normalized price: {calc_e}", file=sys.stderr)


        # Debug print for intermediate values
        print(f"DEBUG worker_scrape_details: Intermediate parsed data (Link ID: {link_id}) - \n"
              f"  parsed_amount: {parsed_data.get('parsed_amount')} (type: {type(parsed_data.get('parsed_amount'))})\n"
              f"  parsed_unit: {parsed_data.get('parsed_unit')}\n"
              f"  explicit_ppu: {explicit_ppu_text}\n"
              f"  main_price: {parsed_data.get('main_price')}\n"
              f"  NormPrice (calc'd): {normalized_price_for_company}\n"
              f"  MinWeightG: {parsed_data.get('min_weight_g')}, MaxWeightG: {parsed_data.get('max_weight_g')}")


        # 5. Prepare data for Product table according to NEW rules
        db_product_data['retail_id'] = parsed_data['retail_id']
        db_product_data['spanish_name'] = parsed_data['spanish_name']
        db_product_data['min_weight_g'] = parsed_data['min_weight_g'] # Add weight range
        db_product_data['max_weight_g'] = parsed_data['max_weight_g'] # Add weight range

        final_parsed_unit = parsed_data['parsed_unit']
        final_parsed_amount = parsed_data['parsed_amount']

        if final_parsed_unit == 'unit':
             db_product_data['amount'] = final_parsed_amount
             db_product_data['measurement'] = 'unit'
             db_product_data['weight'] = Decimal('0.00')
        elif final_parsed_unit in ['g', 'gr', 'kg', 'ml', 'cl', 'l']:
             db_product_data['amount'] = Decimal('1')
             db_product_data['measurement'] = 'g' if final_parsed_unit == 'gr' else final_parsed_unit
             db_product_data['weight'] = final_parsed_amount
        else:
             db_product_data['amount'] = Decimal('1')
             db_product_data['measurement'] = 'unit'
             db_product_data['weight'] = Decimal('0.00')


        # --- Final Validation & Database Ops ---
        if not all([db_product_data.get('retail_id'), db_product_data.get('spanish_name'), normalized_price_for_company is not None]):
             missing = [k for k, v in db_product_data.items() if (v is None or v=="") and k in ['retail_id', 'spanish_name']]
             if normalized_price_for_company is None: missing.append('normalized_price')
             raise ValueError(f"Missing essential data before DB save: {', '.join(missing)}")

        saved_product_object = save_or_get_product(db, db_product_data)
        if not saved_product_object: raise ValueError("Failed to save or retrieve Product entry.")

        product_company_entry = update_or_create_product_company_price(
            db=db, product_id=saved_product_object.product_id,
            company_id=company_id, price=normalized_price_for_company
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