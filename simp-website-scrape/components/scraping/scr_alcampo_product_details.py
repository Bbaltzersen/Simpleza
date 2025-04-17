# components/scraping/scr_alcampo_product_details.py

import time
import sys
import datetime
import uuid
import os
import re # For parsing text
from decimal import Decimal, InvalidOperation

# Database Imports
from database.connection import SessionLocal
from models.alcampo_product_link import Alcampo_Product_Link # To read links and update status
from models.product import Product # Your Product model for saving details
from models.company import Company # Assuming you have a Company model for linking products to companies
from models.product_company import ProductCompany # Assuming you have a ProductCompany model for linking products to companies
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

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
BATCH_SIZE = 10 # Number of links to process per run/batch
PROCESS_TIMEOUT_MINUTES = 5 # Mark links older than this as potentially stuck (optional logic)
# Set path if needed, otherwise leave as None
CHROMEDRIVER_PATH = None # Example: "/usr/local/bin/chromedriver" or "C:/path/to/chromedriver.exe"
# Control profile usage (less critical here, but can keep for consistency)
USE_SEPARATE_PROFILES = False # Set to True if running multiple instances concurrently
PROFILE_BASE_DIR = "./chrome_profiles_details"

# --- Selectors (Derived from your HTML snippet - MAY NEED ADJUSTMENT) ---
NAME_SELECTOR = "h1[class*='sc-q2s63n-0']" # Main product title h1
# Price container first, then the specific span
PRICE_CONTAINER_SELECTOR = "div[data-test='price-container']"
PRICE_SELECTOR_INSIDE_CONTAINER = "span[class*='_display_fucv5_1']"
# Size/Unit container for price per kg/unit info
SIZE_CONTAINER_SELECTOR = "div[data-test='size-container']"
# Cookie button (same as link scraper)
COOKIE_BUTTON_SELECTOR = "#onetrust-accept-btn-handler"

# --- Helper Functions ---

def extract_id_from_url(url: str) -> int | None:
    """Extracts the numeric ID from the end of an Alcampo product URL."""
    match = re.search(r'/(\d+)$', url)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return None
    return None

def parse_price(price_str: str | None) -> Decimal | None:
    """Converts Spanish price string (e.g., '1,79 €') to Decimal."""
    if not price_str:
        return None
    # Remove currency symbols, spaces, etc. Keep comma and digits.
    cleaned_price = re.sub(r'[^\d,]', '', price_str).replace(',', '.')
    try:
        return Decimal(cleaned_price)
    except InvalidOperation:
        print(f"   PARSE_WARN: Could not parse price '{price_str}' to Decimal.", file=sys.stderr)
        return None

def parse_unit_string(unit_str: str | None) -> tuple[Decimal | None, str | None, Decimal | None]:
    """
    Parses string like '1000g Aprox 1,79 € por kilogramo' or '1 ud 2,50 €'.
    Returns: (amount, measurement_unit, price_per_unit_found)
    """
    if not unit_str:
        return None, None, None

    amount = Decimal(1) # Default amount
    unit = None
    price_per = None

    # Normalize string
    unit_str_lower = unit_str.lower().replace(',', '.') # Use dots for decimals

    # --- Extract Price per Unit ---
    # Match patterns like '1.79 € por kilogramo', '1.79 € / kg', '2.50 € / ud' etc.
    price_match = re.search(r'(\d+\.?\d*)\s*€\s*(?:por|/)\s*(kilogramo|kg|unidad|ud|litro|l)', unit_str_lower)
    if price_match:
        try:
            price_per = Decimal(price_match.group(1))
            unit_found = price_match.group(2)
            if unit_found in ['kilogramo', 'kg']:
                unit = 'kg'
            elif unit_found in ['unidad', 'ud']:
                unit = 'unit'
            elif unit_found in ['litro', 'l']:
                 unit = 'l'
            # Add other units as needed (gr, ml etc.) and maybe standardize (e.g., gr->kg)
            else:
                 unit = unit_found # Keep original if not standard

        except InvalidOperation:
            price_per = None # Failed to parse price

    # --- Extract Amount (if different from 1 and unit is weight/volume) ---
    # Look for patterns like '1000g', '75cl', '500 ml' at the start or near 'aprox'
    amount_match = re.search(r'(\d+)\s*(g|gr|kg|ml|cl|l)\b', unit_str_lower)
    if amount_match:
        try:
            num_amount = Decimal(amount_match.group(1))
            unit_measure = amount_match.group(2)

            # Standardize amount based on extracted unit (e.g. convert g to kg if price is per kg)
            if unit == 'kg' and unit_measure in ['g', 'gr']:
                amount = num_amount / Decimal(1000)
            elif unit == 'l' and unit_measure == 'ml':
                 amount = num_amount / Decimal(1000)
            elif unit == 'l' and unit_measure == 'cl':
                 amount = num_amount / Decimal(100)
            elif unit == 'kg' and unit_measure == 'kg':
                 amount = num_amount
            elif unit == 'l' and unit_measure == 'l':
                 amount = num_amount
            # Add more conversions if needed
            else:
                 # If unit types don't match standard conversion, maybe keep amount as 1
                 # or log a warning. Let's default back to 1 for now if unit doesn't match price_per unit.
                 if unit != unit_measure:
                     print(f"   PARSE_WARN: Amount unit '{unit_measure}' doesn't match price unit '{unit}'. Using default amount 1.", file=sys.stderr)
                     amount = Decimal(1)
                 else: # Units match (e.g., price per unit, amount is 5 units)
                     amount = num_amount


        except InvalidOperation:
            pass # Keep default amount 1

    # If no specific unit was found with price_per, default to 'unit'
    if price_per is not None and unit is None:
        unit = 'unit'

    # If price_per couldn't be found, maybe the main price IS the unit price?
    # This requires assumptions - let's return None for price_per if not explicitly found.

    return amount, unit, price_per


def save_product_details(db: Session, data: dict) -> Product | None:
    """Saves the scraped product details to the database."""
    try:
        # Check if product with this retail_id already exists
        existing_product = db.query(Product).filter(Product.retail_id == data['retail_id']).first()
        if existing_product:
            # Update logic (optional - overwrite or skip?)
            # For now, let's skip if it exists to avoid duplicates from race conditions
            # print(f"     DB_INFO: Product with retail_id {data['retail_id']} already exists. Skipping save.")
            return None

        product = Product(
            # product_id is default=uuid.uuid4
            retail_id=data['retail_id'],
            # src_product_id=None, # Set if you link products across retailers later
            english_name=None, # Per user request
            spanish_name=data['spanish_name'],
            amount=data['amount'],
            weight=data['weight'], # Using 'weight' column for price_per_unit reference
            measurement=data['measurement']
            # Add other fields from your Product model if needed
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        # print(f"     DB_ADD: Saved product details for retail_id {data['retail_id']}")
        return product
    except SQLAlchemyError as e:
        db.rollback()
        print(f"     DB_ERROR: SQLAlchemyError saving product details for retail_id {data['retail_id']}. Error: {e}", file=sys.stderr)
        return None
    except Exception as e:
        db.rollback()
        print(f"     DB_ERROR: Unexpected error saving product details for retail_id {data['retail_id']}. Error: {e}", file=sys.stderr)
        return None

def mark_link_processed(db: Session, link_id: uuid.UUID):
    """Marks a link as processed by setting the 'details_scraped_at' timestamp."""
    try:
        link = db.query(Alcampo_Product_Link).filter(Alcampo_Product_Link.product_link_id == link_id).first()
        if link:
            link.details_scraped_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
        else:
             print(f"     DB_WARN: Could not find link with ID {link_id} to mark as processed.", file=sys.stderr)
    except SQLAlchemyError as e:
        db.rollback()
        print(f"     DB_ERROR: SQLAlchemyError marking link {link_id} processed. Error: {e}", file=sys.stderr)
    except Exception as e:
        db.rollback()
        print(f"     DB_ERROR: Unexpected error marking link {link_id} processed. Error: {e}", file=sys.stderr)


# --- Main Processing Logic ---
def process_links():
    """Fetches unprocessed links and scrapes details for each."""
    print("--- Starting Product Detail Scraping ---")
    processed_count = 0
    error_count = 0
    total_start_time = time.time()

    db = SessionLocal()
    try:
        # Fetch links that haven't been processed
        # Optional: Add filter for links older than PROCESS_TIMEOUT_MINUTES if they got stuck
        links_to_process = db.query(Alcampo_Product_Link)\
                             .filter(Alcampo_Product_Link.details_scraped_at == None)\
                             .limit(BATCH_SIZE)\
                             .all()

        if not links_to_process:
            print("No unprocessed product links found.")
            return

        print(f"Found {len(links_to_process)} links to process in this batch.")

        for i, link_obj in enumerate(links_to_process):
            print(f"\n[{i+1}/{len(links_to_process)}] Processing Link ID: {link_obj.product_link_id}")
            print(f"   URL: {link_obj.product_link}")
            link_start_time = time.time()
            driver = None
            success = False

            # Prepare data dictionary
            scraped_data = {
                'retail_id': None,
                'spanish_name': None,
                'amount': Decimal(1), # Default
                'weight': None, # Represents price_per_unit
                'measurement': 'unit' # Default
            }

            try:
                # --- Initialize WebDriver ---
                options = Options()
                options.add_argument("--no-sandbox")
                options.add_argument("--disable-dev-shm-usage")
                options.add_argument("--disable-extensions")
                options.add_argument("--disable-gpu")
                options.add_argument("--headless=new")
                options.add_argument("--window-size=1920,1080")
                # Disable images and CSS for faster loading (optional)
                # options.add_argument("--blink-settings=imagesEnabled=false")
                # options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})


                if USE_SEPARATE_PROFILES:
                    profile_path = os.path.abspath(os.path.join(PROFILE_BASE_DIR, f"profile_detail_{os.getpid()}")) # Unique per process
                    os.makedirs(profile_path, exist_ok=True)
                    options.add_argument(f"--user-data-dir={profile_path}")

                service = None
                if CHROMEDRIVER_PATH and os.path.exists(CHROMEDRIVER_PATH):
                    service = Service(executable_path=CHROMEDRIVER_PATH)
                elif CHROMEDRIVER_PATH:
                     print(f"   WARNING: CHROMEDRIVER_PATH specified but not found: {CHROMEDRIVER_PATH}. Trying system PATH.", file=sys.stderr)

                driver = webdriver.Chrome(service=service, options=options)
                driver.set_page_load_timeout(30) # Timeout for page load

                # --- Navigate & Handle Cookies ---
                driver.get(link_obj.product_link)
                time.sleep(1) # Small wait for initial render
                try:
                    cookie_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, COOKIE_BUTTON_SELECTOR))
                    )
                    cookie_button.click()
                    time.sleep(0.5)
                except TimeoutException: pass # OK if not found
                except ElementClickInterceptedException:
                    print(f"   WARN: Cookie button click intercepted. Trying JS click.")
                    try:
                        driver.execute_script("arguments[0].click();", cookie_button)
                        time.sleep(0.5)
                    except Exception as js_e: print(f"   ERROR: JS click failed: {js_e}", file=sys.stderr)
                except Exception as e: print(f"   WARN: Cookie banner error: {e}", file=sys.stderr)

                # --- Extract Data ---
                wait = WebDriverWait(driver, 10) # Wait up to 10 seconds for elements

                # 1. Retail ID (from URL)
                scraped_data['retail_id'] = extract_id_from_url(link_obj.product_link)
                if not scraped_data['retail_id']:
                     print(f"   ERROR: Could not extract retail_id from URL {link_obj.product_link}", file=sys.stderr)
                     raise ValueError("Missing retail_id") # Stop processing this link

                # 2. Name
                try:
                    name_element = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, NAME_SELECTOR)))
                    scraped_data['spanish_name'] = name_element.text.strip()
                    print(f"   Name: {scraped_data['spanish_name']}")
                except TimeoutException:
                     print(f"   ERROR: Timeout finding name element.", file=sys.stderr)
                     # Decide if this is critical - maybe continue for price? Let's error for now.
                     raise ValueError("Missing product name")


                # 3. Price
                main_price = None
                try:
                    price_container = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, PRICE_CONTAINER_SELECTOR)))
                    price_element = price_container.find_element(By.CSS_SELECTOR, PRICE_SELECTOR_INSIDE_CONTAINER)
                    main_price_str = price_element.text.strip()
                    main_price = parse_price(main_price_str)
                    print(f"   Price Str: '{main_price_str}' -> Parsed: {main_price}")
                except TimeoutException:
                     print(f"   ERROR: Timeout finding price container.", file=sys.stderr)
                     # Price is essential, treat as error
                     raise ValueError("Missing product price")
                except NoSuchElementException:
                     print(f"   ERROR: Could not find price span within container.", file=sys.stderr)
                     raise ValueError("Missing product price span")


                # 4. Unit String (for amount, measurement, price/unit)
                amount = Decimal(1)
                measurement = 'unit' # Default
                price_per_unit = None
                try:
                    size_container = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, SIZE_CONTAINER_SELECTOR)))
                    unit_str = size_container.text.strip()
                    print(f"   Unit Str: '{unit_str}'")
                    amount, measurement, price_per_unit = parse_unit_string(unit_str)
                    # Use parsed values if found, otherwise keep defaults
                    scraped_data['amount'] = amount if amount is not None else Decimal(1)
                    scraped_data['measurement'] = measurement if measurement is not None else 'unit'
                    # We store the price_per_unit in the 'weight' column as discussed
                    scraped_data['weight'] = price_per_unit
                    print(f"   Parsed Unit Info -> Amount: {scraped_data['amount']}, Measure: {scraped_data['measurement']}, Price/Unit: {scraped_data['weight']}")

                except TimeoutException:
                     print(f"   WARN: Timeout finding size/unit container. Using defaults (Amount=1, Measure='unit', Price/Unit=None).", file=sys.stderr)
                     # Assign the main price to weight if price per unit is missing? Or leave weight Null?
                     # Let's leave weight Null if specific price/unit not found.
                     scraped_data['amount'] = Decimal(1)
                     scraped_data['measurement'] = 'unit'
                     scraped_data['weight'] = None # Explicitly None if not found
                except NoSuchElementException:
                     print(f"   WARN: Could not find size/unit container element.", file=sys.stderr)
                     scraped_data['amount'] = Decimal(1)
                     scraped_data['measurement'] = 'unit'
                     scraped_data['weight'] = None


                # --- Validation (Ensure essential data is present) ---
                if not all([scraped_data['retail_id'], scraped_data['spanish_name']]): # Price is checked via exception
                     raise ValueError("Missing essential data (ID or Name)")


                # --- Save to Database ---
                saved_product = save_product_details(db, scraped_data)
                if saved_product:
                    processed_count += 1
                    success = True
                else:
                     # Error logged in save_product_details, or product already existed
                     # If it already existed, we should still mark the link processed.
                     # Check again if product exists now to decide if link should be marked.
                     existing_product_check = db.query(Product).filter(Product.retail_id == scraped_data['retail_id']).first()
                     if existing_product_check:
                          print(f"   INFO: Product retail_id {scraped_data['retail_id']} exists. Marking link processed.")
                          success = True # Mark as success even if save was skipped
                     else:
                          print(f"   ERROR: Failed to save product details for retail_id {scraped_data['retail_id']}.", file=sys.stderr)
                          error_count += 1


            except WebDriverException as e:
                print(f"   FATAL WebDriver error for URL {link_obj.product_link}: {e}", file=sys.stderr)
                error_count += 1
            except ValueError as e: # Catch our specific validation errors
                 print(f"   ERROR: Validation failed for {link_obj.product_link}: {e}", file=sys.stderr)
                 error_count += 1
            except Exception as e:
                print(f"   FATAL Unexpected error for URL {link_obj.product_link}: {e}", file=sys.stderr)
                import traceback
                traceback.print_exc()
                error_count += 1
            finally:
                # --- Cleanup Driver ---
                if driver:
                    driver.quit()

                # --- Mark Link Processed (if successful) ---
                if success:
                     mark_link_processed(db, link_obj.product_link_id)

                link_duration = time.time() - link_start_time
                print(f"   Finished processing link. Success: {success}. Time: {link_duration:.2f}s")
                time.sleep(1) # Small delay between requests

    except Exception as e:
        print(f"\nFATAL Error during batch processing: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
    finally:
        if db:
            db.close()

    total_duration = time.time() - total_start_time
    print("\n--- Product Detail Scraping Finished ---")
    print(f"Total Time: {total_duration:.2f}s")
    print(f"Successfully Processed & Saved (New): {processed_count}")
    print(f"Errors / Skipped Saves: {error_count}")


if __name__ == "__main__":
    process_links()