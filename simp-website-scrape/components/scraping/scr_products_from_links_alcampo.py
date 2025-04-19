# Use modern postponed evaluation of type annotations (PEP 563)
# This helps resolve the Pylance "Variable not allowed in type expression" error
# by allowing type hints to be treated as strings initially.
from __future__ import annotations

import time
import sys
import os
import datetime  # Needed for mark_link_processed
import uuid      # Needed for arguments and DB helpers
import re        # Needed for DB helpers
from typing import Tuple, Optional, Dict, Any, TYPE_CHECKING # Import typing helpers
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP # Needed for helpers

# --- Database Imports ---
# Attempt runtime imports, handle failure gracefully for runtime,
# but type hints will use string forward references or TYPE_CHECKING block if needed.
try:
    from database.connection import SessionLocal
    from models.product import Product
    from models.company import Company
    from models.product_company import ProductCompany
    from models.alcampo_product_link import Alcampo_Product_Link
    from sqlalchemy.orm import Session
    from sqlalchemy.exc import SQLAlchemyError, IntegrityError
except ImportError as e:
    print(f"FATAL ERROR (Worker Setup): Could not import database components: {e}", file=sys.stderr)
    # Define dummy classes/functions or None if needed for the script to load,
    # but it will likely fail later at runtime if imports truly failed.
    # Setting to None is often safer than dummy types unless specific attributes are needed.
    SessionLocal = None
    Product = None # type: ignore # Let runtime fail if Product is used when None
    Company = None # type: ignore
    ProductCompany = None # type: ignore
    Alcampo_Product_Link = None # type: ignore
    Session = None # type: ignore
    SQLAlchemyError = Exception # Fallback exception
    IntegrityError = Exception # Fallback exception
    # Exit or raise a custom exception might be better here depending on requirements
    # sys.exit(f"FATAL ERROR: Missing database components: {e}")


# --- Import Scraping Helper functions ---
try:
    from components.scraping.product_helper_functions.title import extract_title
    from components.scraping.product_helper_functions.price import extract_price_per_unit
    from components.scraping.product_helper_functions.size_info import extract_size_info
    from components.scraping.product_helper_functions.size_deviation import extract_size_deviation
    # from components.scraping.product_helper_functions.main_price import extract_main_price # Add when created
except ImportError as e:
    print(f"FATAL ERROR (Worker Setup): Could not import scraping helpers: {e}", file=sys.stderr)
    # Define dummy functions so the script loads, but scraping will fail
    def extract_title(*args, **kwargs) -> Optional[str]: return None
    def extract_price_per_unit(*args, **kwargs) -> Tuple[Optional[Decimal], Optional[str]]: return None, None
    def extract_size_info(*args, **kwargs) -> Tuple[Optional[Decimal], Optional[Decimal], Optional[str]]: return None, None, None
    def extract_size_deviation(*args, **kwargs) -> Tuple[Optional[Decimal], Optional[Decimal]]: return None, None
    # sys.exit(f"FATAL ERROR: Missing scraping helpers: {e}")


# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, WebDriverException, ElementClickInterceptedException
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# --- Configuration ---
CHROMEDRIVER_PATH: Optional[str] = None # Optional: Set path if not in system PATH
USE_SEPARATE_PROFILES: bool = True # Set to False if you don't need separate profiles
PROFILE_BASE_DIR: str = "./chrome_profiles_details_worker_combined" # Renamed profile dir

# --- Selectors Needed by This Worker ---
BODY_SELECTOR: str = "body"
COOKIE_BUTTON_SELECTOR: str = "#onetrust-accept-btn-handler"

# --- Helper Functions (DB Interaction & Parsing) ---

def extract_id_from_url(url: str) -> Optional[str]:
    """Extracts the trailing numeric ID from an Alcampo product URL."""
    if not url: return None
    match = re.search(r'/(\d+)$', url.strip())
    return match.group(1) if match else None

# Use string forward reference 'Session' and 'Product' for type hints
def save_or_get_product(db: 'Session', product_data: Dict[str, Any]) -> Optional['Product']:
    """
    Saves a new product or retrieves/updates an existing one based on retail_id.
    Returns the Product object or None on failure.
    """
    if not Product: # Check if import failed at runtime
         print(" DB_HELPER_ERROR: Product model not available.", file=sys.stderr)
         return None

    retail_id = product_data.get('retail_id')
    if not retail_id:
        print(f"   DB_HELPER_ERROR: retail_id missing in product_data", file=sys.stderr)
        return None
    try:
        existing_product = db.query(Product).filter(Product.retail_id == retail_id).first() # type: ignore
        if existing_product:
            needs_update = False # Check if updates are needed
            # Check each field and update only if the new value is provided and different
            if product_data.get('spanish_name') and existing_product.spanish_name != product_data['spanish_name']:
                existing_product.spanish_name = product_data['spanish_name']
                needs_update = True
            if product_data.get('quantity') is not None and existing_product.quantity != product_data.get('quantity'):
                existing_product.quantity = product_data['quantity']
                needs_update = True
            if product_data.get('item_size_value') is not None and existing_product.item_size_value != product_data.get('item_size_value'):
                existing_product.item_size_value = product_data['item_size_value']
                needs_update = True
            if product_data.get('item_measurement') and existing_product.item_measurement != product_data.get('item_measurement'):
                existing_product.item_measurement = product_data['item_measurement']
                needs_update = True
            if product_data.get('min_weight_g') is not None and existing_product.min_weight_g != product_data.get('min_weight_g'):
                existing_product.min_weight_g = product_data['min_weight_g']
                needs_update = True
            if product_data.get('max_weight_g') is not None and existing_product.max_weight_g != product_data.get('max_weight_g'):
                existing_product.max_weight_g = product_data['max_weight_g']
                needs_update = True

            if needs_update:
                db.commit()
                db.refresh(existing_product)
                print(f"   DB_HELPER_UPDATE: Updated product {retail_id}")
            return existing_product
        else:
            # Create new product - ensure essential fields are present
            required_fields = ['retail_id', 'spanish_name', 'quantity', 'item_size_value', 'item_measurement']
            # Check if all required fields are in product_data AND are not None
            if not all(f in product_data and product_data[f] is not None for f in required_fields):
                missing = [f for f in required_fields if not (f in product_data and product_data[f] is not None)]
                print(f"   DB_HELPER_ERROR: Missing required fields {missing} for creating product {retail_id}", file=sys.stderr)
                return None

            # Create a dictionary with only the fields expected by the Product model constructor
            # This prevents passing unexpected keys if product_data contains extra info
            product_init_data = {k: v for k, v in product_data.items() if hasattr(Product, k)}

            new_product = Product(**product_init_data) # Use dictionary unpacking
            db.add(new_product)
            db.commit()
            db.refresh(new_product)
            print(f"   DB_HELPER_ADD: Created product '{new_product.spanish_name}' (RetailID: {retail_id})")
            return new_product
    except SQLAlchemyError as e:
        db.rollback()
        print(f"   DB_HELPER_ERROR: SQLAlchemyError saving/getting product {retail_id}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        db.rollback()
        print(f"   DB_HELPER_ERROR: Unexpected error saving/getting product {retail_id}: {e}", file=sys.stderr)
        return None

def calculate_normalized_price(ppu_price: Optional[Decimal], ppu_unit: Optional[str]) -> Optional[Decimal]:
    """Calculates a normalized price (per kg/l/unit), returns Decimal or None."""
    if ppu_price is not None and ppu_unit in ['kg', 'l', 'unit']:
        # Ensure price is rounded to 2 decimal places
        return ppu_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    # Add fallback logic using main price here later if needed
    # elif main_price is not None and quantity is not None and item_size is not None ...
    #    calculate based on total price and size
    return None

# Use string forward reference 'Session' and 'ProductCompany' for type hints
def update_or_create_product_company_price(db: 'Session', product_id: uuid.UUID, company_id: uuid.UUID, norm_price: Optional[Decimal]) -> Optional['ProductCompany']:
    """
    Updates or creates the price entry in the ProductCompany table.
    Returns the ProductCompany object or None on failure or if price is None.
    """
    if not ProductCompany: # Check if import failed at runtime
         print(" DB_HELPER_ERROR: ProductCompany model not available.", file=sys.stderr)
         return None
    if norm_price is None:
        # print(f"   DB_HELPER_INFO: No normalized price provided for ProdID {product_id}, skipping ProductCompany update.")
        return None # No price to update/create

    try:
        # Ensure price is correctly quantized before comparison or insertion
        quantized_price = norm_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        pc = db.query(ProductCompany).filter_by(product_id=product_id, company_id=company_id).first() # type: ignore

        if pc:
            # Update price only if it has changed
            if pc.price != quantized_price:
                pc.price = quantized_price
                db.commit()
                db.refresh(pc)
                # print(f"   DB_HELPER_UPDATE: Updated ProductCompany price for ProdID {product_id}")
            return pc
        else:
            # Create new ProductCompany entry
            new_pc = ProductCompany(product_id=product_id, company_id=company_id, price=quantized_price) # type: ignore
            db.add(new_pc)
            db.commit()
            db.refresh(new_pc)
            print(f"   DB_HELPER_ADD: Created ProductCompany price for ProdID {product_id}")
            return new_pc
    except SQLAlchemyError as e:
        db.rollback()
        print(f"   DB_HELPER_ERROR: SQLAlchemyError updating/creating ProductCompany for ProdID {product_id}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        db.rollback()
        print(f"   DB_HELPER_ERROR: Unexpected error updating/creating ProductCompany for ProdID {product_id}: {e}", file=sys.stderr)
        return None

# Use string forward reference 'Session' for type hint
def mark_link_processed(db: 'Session', link_id: uuid.UUID) -> bool:
    """Marks a specific Alcampo_Product_Link as processed by setting details_scraped_at."""
    if not Alcampo_Product_Link: # Check if import failed at runtime
         print(" DB_HELPER_ERROR: Alcampo_Product_Link model not available.", file=sys.stderr)
         return False
    if not link_id:
        print("   DB_HELPER_WARN: No link_id provided to mark as processed.", file=sys.stderr)
        return False
    try:
        link = db.query(Alcampo_Product_Link).filter_by(product_link_id=link_id).first() # type: ignore
        if link:
            link.details_scraped_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            return True
        else:
            print(f"   DB_HELPER_WARN: Link ID {link_id} not found to mark as processed.", file=sys.stderr)
            return False
    except SQLAlchemyError as e:
        db.rollback()
        print(f"   DB_HELPER_ERROR: SQLAlchemyError marking link {link_id} processed: {e}", file=sys.stderr)
        return False
    except Exception as e:
        db.rollback()
        print(f"   DB_HELPER_ERROR: Unexpected error marking link {link_id} processed: {e}", file=sys.stderr)
        return False


# --- Main Worker Function (Scrapes and Saves) ---
def worker_scrape_details(link_url: str, link_id: uuid.UUID, company_id: uuid.UUID, worker_id: int) -> Tuple[uuid.UUID, bool]:
    """
    Worker function: Scrapes product details from a given Alcampo URL using Selenium helpers,
    then saves or updates the information in the database via DB helpers.

    Args:
        link_url: The URL of the Alcampo product page.
        link_id: The UUID of the link record in the Alcampo_Product_Link table.
        company_id: The UUID of the company (Alcampo) in the Company table.
        worker_id: An identifier for the worker process for logging purposes.

    Returns:
        A tuple containing (link_id, success_boolean).
    """
    start_time = time.time()
    success = False
    driver: Optional[webdriver.Chrome] = None
    db: Optional[Session] = None # Use 'Session' from runtime import scope
    log_prefix = f"[Worker {worker_id:02d} Link {str(link_id)[:8]}]" # Shorten UUID for logs

    print(f"{log_prefix} Starting: {link_url}")

    # --- Check Prerequisites ---
    if not SessionLocal or not Product or not ProductCompany or not Alcampo_Product_Link:
         print(f"{log_prefix} ABORT: Essential database components missing due to import errors.", file=sys.stderr)
         # Return failure immediately if DB setup failed during import
         return (link_id, False)

    scraped_data: Dict[str, Any] = {}
    essential_data_present = False

    # --- Scraping Phase ---
    try:
        # --- WebDriver Setup ---
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-gpu") # Often necessary for headless mode
        options.add_argument("--window-size=1920,1080") # Specify window size
        # Suppress DevTools listening message
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        # Disable image loading for speed
        options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})
        options.add_argument("--blink-settings=imagesEnabled=false")

        if USE_SEPARATE_PROFILES:
            profile_path = os.path.abspath(os.path.join(PROFILE_BASE_DIR, f"profile_detail_{worker_id}"))
            # Ensure the directory exists
            os.makedirs(profile_path, exist_ok=True)
            options.add_argument(f"--user-data-dir={profile_path}") # Separate profile for each worker

        service = None
        if CHROMEDRIVER_PATH and os.path.exists(CHROMEDRIVER_PATH):
            service = Service(executable_path=CHROMEDRIVER_PATH)
            print(f"{log_prefix} Using ChromeDriver from: {CHROMEDRIVER_PATH}")

        print(f"{log_prefix} Initializing WebDriver...")
        driver = webdriver.Chrome(service=service, options=options)
        driver.set_page_load_timeout(75) # Increased timeout for potentially slow pages

        # --- Navigation & Cookies ---
        print(f"{log_prefix} Navigating to URL...")
        driver.get(link_url)

        # Wait for the body element to be present
        WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, BODY_SELECTOR)))
        time.sleep(2) # Small static wait for dynamic content loading after body is present

        # Handle cookie consent banner - attempt gracefully
        try:
            cookie_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, COOKIE_BUTTON_SELECTOR))
            )
            print(f"{log_prefix} Cookie banner found, attempting to click...")
            try:
                cookie_button.click()
                print(f"{log_prefix} Clicked cookie button.")
            except ElementClickInterceptedException:
                print(f"{log_prefix} Cookie button click intercepted, trying JavaScript click...")
                driver.execute_script("arguments[0].click();", cookie_button)
                print(f"{log_prefix} Clicked cookie button via JS.")
            time.sleep(0.5) # Wait briefly after click
        except TimeoutException:
            print(f"{log_prefix} Cookie banner not found or clickable within timeout.")
        except Exception as e_cookie:
            print(f"{log_prefix} WARN: Error handling cookie banner: {e_cookie}", file=sys.stderr)
            pass # Ignore cookie issues and proceed

        # --- Call Scraping Helpers ---
        print(f"{log_prefix} Extracting product data...")
        title = extract_title(driver, worker_id)
        ppu_price, ppu_unit = extract_price_per_unit(driver, worker_id)
        quantity_dec, item_size, item_unit = extract_size_info(driver, worker_id)
        min_w, max_w = extract_size_deviation(driver, worker_id)
        # main_price = extract_main_price(driver, worker_id) # Add later when implemented

        # Convert quantity to integer if it's a Decimal, otherwise keep None
        quantity = int(quantity_dec) if quantity_dec is not None else None

        # --- Store and Validate Scraped Data ---
        scraped_data = {
            "product_title": title,
            "ppu_price": ppu_price,
            "ppu_unit": ppu_unit,
            "quantity": quantity,
            "item_size_value": item_size,
            "item_measurement": item_unit,
            "min_weight_g": min_w,
            "max_weight_g": max_w,
            # "main_price": main_price # Add later
        }

        # Define essential data fields required for DB insertion (Product base info)
        essential_fields = ["product_title", "quantity", "item_size_value", "item_measurement"]
        essential_data_present = all(scraped_data.get(field) is not None for field in essential_fields)

        if essential_data_present:
            print(f"{log_prefix} Essential data extracted successfully.")
            # Optionally print extracted data for debugging
            # print(f"{log_prefix} Data: Title='{title}', Qty={quantity}, Size={item_size}{item_unit}, PPU={ppu_price}/{ppu_unit}")
        else:
            missing_essentials = [field for field in essential_fields if scraped_data.get(field) is None]
            print(f"{log_prefix} WARN: Missing essential data after scraping: {missing_essentials}", file=sys.stderr)
            # Optionally print all scraped data for debugging missing fields
            # print(f"{log_prefix} All Scraped Data: {scraped_data}", file=sys.stderr)


    except TimeoutException as e:
        print(f"{log_prefix} SCRAPE_ERROR: TimeoutException - Page load or element wait timed out. {e}", file=sys.stderr)
    except WebDriverException as e:
        print(f"{log_prefix} SCRAPE_ERROR: WebDriverException - Browser/driver issue: {type(e).__name__} - {e}", file=sys.stderr)
    except Exception as e:
        # Catch any other unexpected error during scraping phase
        print(f"{log_prefix} SCRAPE_ERROR: Unexpected error during scraping - {type(e).__name__}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr) # Print stack trace for unexpected errors
    finally:
        # Ensure WebDriver is closed regardless of success or failure
        if driver:
            print(f"{log_prefix} Closing WebDriver...")
            driver.quit()

    # --- Database Saving Phase ---
    # Proceed only if essential data was successfully scraped
    if essential_data_present:
        try:
            print(f"{log_prefix} Attempting database operations...")
            # Create a new session for this worker task
            db = SessionLocal() # type: ignore # Assume SessionLocal() returns a valid Session if not None

            retail_id = extract_id_from_url(link_url)
            if not retail_id:
                # This should ideally not happen if URL is valid, but check just in case
                raise ValueError(f"Could not extract retail_id from URL: {link_url}")

            # Prepare data dictionary specifically for the Product model
            product_data_for_db = {
                'retail_id': retail_id,
                'spanish_name': scraped_data["product_title"],
                'quantity': scraped_data["quantity"],
                'item_size_value': scraped_data["item_size_value"],
                'item_measurement': scraped_data["item_measurement"],
                # Use .get() for optional fields to avoid KeyError if they weren't scraped
                'min_weight_g': scraped_data.get("min_weight_g"),
                'max_weight_g': scraped_data.get("max_weight_g"),
            }

            # Save or update the product information
            product_object = save_or_get_product(db, product_data_for_db)

            if not product_object:
                # If product couldn't be saved/retrieved, we cannot proceed
                raise ValueError(f"Failed to save or get product record for retail_id {retail_id}")

            # Calculate the normalized price (e.g., price per kg/l/unit)
            normalized_price = calculate_normalized_price(
                scraped_data.get("ppu_price"), scraped_data.get("ppu_unit")
            )

            # Update or create the price in the ProductCompany linking table
            pc_entry = update_or_create_product_company_price(
                db=db,
                product_id=product_object.product_id, # Use the UUID from the retrieved/created product
                company_id=company_id, # Use the company_id passed to the worker
                norm_price=normalized_price
            )

            # Check if price update/creation was attempted but failed
            if normalized_price is not None and not pc_entry:
                # Log a warning, but don't necessarily fail the whole process
                # unless price is absolutely critical AND always expected.
                print(f"{log_prefix} DB_WARN: Normalized price ({normalized_price}) was present, but failed to update/create ProductCompany entry for ProdID {product_object.product_id}", file=sys.stderr)

            # Mark the original link as processed in the database
            # This should be the last step within the transaction
            marked_ok = mark_link_processed(db, link_id)

            if marked_ok:
                success = True # Set final success state only if all DB ops including marking are okay
                print(f"{log_prefix} DB operations completed successfully.")
            else:
                # This is critical - if we can't mark the link, it might be re-processed.
                print(f"{log_prefix} DB_FAIL: CRITICAL - Failed to mark link {link_id} as processed!", file=sys.stderr)
                # Ensure success is False and potentially raise an error or handle retry logic
                success = False
                db.rollback() # Rollback transaction if marking failed

        except Exception as e:
            # Catch any error during the database operations phase
            print(f"{log_prefix} DB_FAIL: Error during DB operations: {type(e).__name__} - {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr) # Print stack trace for DB errors
            if db:
                try:
                    db.rollback() # Attempt to rollback any partial changes
                    print(f"{log_prefix} DB transaction rolled back.")
                except Exception as rb_e:
                    print(f"{log_prefix} DB_FAIL: Error during rollback: {rb_e}", file=sys.stderr)
            success = False # Ensure success is false if any DB error occurs
        finally:
            # Ensure the database session is closed
            if db:
                db.close()
                # print(f"{log_prefix} Database session closed.")

    else: # Essential data wasn't scraped
        print(f"{log_prefix} SKIP_SAVE: Essential data missing from scraping phase. Not attempting DB operations.")
        success = False # Mark as failed if essential data is missing

    # --- Final Logging ---
    duration = time.time() - start_time
    status_str = "Success" if success else "Failed"
    print(f"{log_prefix} Finished. Status: {status_str}. Duration: {duration:.2f}s\n")

    # Return the link_id and the final success status
    return (link_id, success)

# Example usage block (optional, for testing)
if __name__ == '__main__':
    print("Running scr_product_details_from_links_alcampo.py directly (for testing)")

    # --- Dummy Data for Testing ---
    # Replace with actual data or load from a test setup
    test_link_url = "https://www.alcampo.es/compra-online/frescos/frutas/platanos-y-bananas/c/W1103" # Example category URL, not product
    test_product_url = "https://www.alcampo.es/compra-online/frescos/frutas/platanos-y-bananas/alcampo-produccion-controlada-platano-de-canarias-bolsa-1-kg/p/7569" # Example product URL
    test_link_id = uuid.uuid4() # Generate a dummy UUID
    test_company_id = uuid.uuid4() # Generate a dummy UUID for Alcampo
    test_worker_id = 0

    print(f"Simulating worker {test_worker_id} for link ID {test_link_id}")
    print(f"URL: {test_product_url}")
    print(f"Company ID: {test_company_id}")

    # --- Database Setup (Simplified for Testing) ---
    # In a real test, you might want to use an in-memory SQLite DB
    # or mock the database interactions. This example assumes DB setup
    # works as in the main application but might fail if run standalone.
    if SessionLocal:
        print("Attempting to run worker function...")
        try:
            # Ensure necessary DB models are available if running standalone
            # This might require creating tables if using a real test DB
            # from database.base import Base # Assuming you have a Base
            # from database.connection import engine # Assuming you have engine
            # Base.metadata.create_all(bind=engine) # Create tables if they don't exist

            # Create a dummy company entry if needed for FK constraint
            # with SessionLocal() as test_db:
            #      if not test_db.query(Company).filter_by(company_id=test_company_id).first():
            #          test_db.add(Company(company_id=test_company_id, name="Alcampo (Test)"))
            #          test_db.commit()

             result_link_id, result_success = worker_scrape_details(
                 link_url=test_product_url,
                 link_id=test_link_id,
                 company_id=test_company_id,
                 worker_id=test_worker_id
             )
             print(f"\nWorker function finished.")
             print(f"Result Link ID: {result_link_id}")
             print(f"Result Success: {result_success}")

        except Exception as main_e:
             print(f"\nError running worker function in __main__: {main_e}", file=sys.stderr)
             import traceback
             traceback.print_exc(file=sys.stderr)
    else:
        print("\nSkipping worker function run because SessionLocal is not available (likely import error).")

