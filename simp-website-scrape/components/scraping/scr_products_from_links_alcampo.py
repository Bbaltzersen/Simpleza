# components/scraping/scr_product_details_from_links_alcampo.py

import time
import sys
import os
from decimal import Decimal # Needed for return types from helpers

# --- Import helper functions ---
from components.scraping.product_helper_functions.title import extract_title
from components.scraping.product_helper_functions.price import extract_price_per_unit
from components.scraping.product_helper_functions.size_info import extract_size_info

# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    # NoSuchElementException,
    TimeoutException, WebDriverException, ElementClickInterceptedException
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# --- Configuration ---
CHROMEDRIVER_PATH = None # Optional: Set path if not in system PATH
USE_SEPARATE_PROFILES = True # Set to False if you don't need separate profiles
PROFILE_BASE_DIR = "./chrome_profiles_orchestrator"

# --- Selectors Needed by This Orchestrator ---
BODY_SELECTOR = "body"
COOKIE_BUTTON_SELECTOR = "#onetrust-accept-btn-handler"

# --- Main Orchestration Function ---
# Updated function signature and docstring
def scrape_product_details(link_url: str, worker_id: int = 0) -> tuple[str | None, Decimal | None, str | None, int | None, Decimal | None, str | None]:
    """
    Orchestrates the extraction of product details (title, PPU, quantity, item size)
    from an Alcampo product page URL by calling helper functions.

    Args:
        link_url: The URL of the product page.
        worker_id: An optional ID used for profile directory naming and logging.

    Returns:
        A tuple containing:
         - product_title (str | None)
         - ppu_price (Decimal | None): Price Per Unit (€/kg, €/l, €/unit).
         - ppu_unit (str | None): Unit for PPU ('kg', 'l', 'unit').
         - quantity (int | None): Number of items in the pack (e.g., 1, 4, 12).
         - item_size_value (Decimal | None): Numerical size of one item (e.g., 500, 1, 120).
         - item_measurement (str | None): Unit for item_size_value ('g', 'kg', 'ml', 'cl', 'l', 'unit').
    """
    start_time = time.time()
    # Initialize result variables matching the return tuple
    product_title: str | None = None
    ppu_price: Decimal | None = None
    ppu_unit: str | None = None
    quantity: int | None = None            # Renamed from product_amount, type hint int
    item_size_value: Decimal | None = None # New variable
    item_measurement: str | None = None    # Renamed from product_unit
    driver: webdriver.Chrome | None = None
    log_prefix = f"[Orchestrator Worker {worker_id:02d}]"

    print(f"{log_prefix} Starting processing for: {link_url}")

    try:
        # --- WebDriver Setup ---
        # (WebDriver setup code remains the same)
        options = Options()
        options.add_argument("--no-sandbox"); options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions"); options.add_argument("--disable-gpu")
        # options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})
        options.add_argument("--blink-settings=imagesEnabled=false")

        if USE_SEPARATE_PROFILES:
            profile_path = os.path.abspath(os.path.join(PROFILE_BASE_DIR, f"profile_orch_{worker_id}"))
            os.makedirs(profile_path, exist_ok=True)
            options.add_argument(f"--user-data-dir={profile_path}")

        service = None
        if CHROMEDRIVER_PATH and os.path.exists(CHROMEDRIVER_PATH):
            service = Service(executable_path=CHROMEDRIVER_PATH)

        driver = webdriver.Chrome(service=service, options=options)
        driver.set_page_load_timeout(60)

        # --- Navigation & Basic Wait ---
        # (Navigation and wait code remains the same)
        print(f"{log_prefix} Navigating to URL...")
        driver.get(link_url)
        try:
            WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, BODY_SELECTOR)))
            print(f"{log_prefix} Page body loaded.")
        except TimeoutException:
            print(f"{log_prefix} ERROR: Page body did not load within 30 seconds.", file=sys.stderr)
            if driver: driver.quit()
            return None, None, None, None, None, None # Return tuple indicating failure (6 Nones)
        time.sleep(2)

        # --- Handle Cookies (Best Effort) ---
        # (Cookie handling code remains the same)
        try:
            print(f"{log_prefix} Checking for cookie button...")
            cookie_button = WebDriverWait(driver, 5).until( EC.element_to_be_clickable((By.CSS_SELECTOR, COOKIE_BUTTON_SELECTOR)) )
            try: cookie_button.click(); print(f"{log_prefix} Clicked cookie button.")
            except ElementClickInterceptedException: driver.execute_script("arguments[0].click();", cookie_button); print(f"{log_prefix} Clicked cookie button via JS.")
            time.sleep(0.5)
        except Exception: print(f"{log_prefix} Cookie button not found or clickable within timeout.")

        # --- Call Extraction Helpers ---
        print(f"{log_prefix} Calling title extraction helper...")
        product_title = extract_title(driver, worker_id)

        print(f"{log_prefix} Calling price-per-unit extraction helper...")
        ppu_price, ppu_unit = extract_price_per_unit(driver, worker_id)

        print(f"{log_prefix} Calling size info extraction helper...")
        # Correctly call extract_size_info and unpack its expected 3 results
        # Note: extract_size_info needs to be fixed in the next step to return these 3 values
        quantity_dec, item_size_value, item_measurement = extract_size_info(driver, worker_id)
        
        # Convert quantity from Decimal (if returned by parser) to Int for the model
        if quantity_dec is not None:
            try:
                quantity = int(quantity_dec)
            except (ValueError, TypeError):
                 print(f"{log_prefix} WARN: Could not convert extracted quantity '{quantity_dec}' to integer.", file=sys.stderr)
                 quantity = None # Set to None if conversion fails
        else:
            quantity = None


        # --- Placeholder for calling other future helpers ---
        # e.g., main_price = extract_main_price(driver, worker_id)
        # ... etc ...

        # --- Final Check (Optional - check essential fields) ---
        if not product_title or not quantity or not item_size_value or not item_measurement:
             missing_parts = []
             if not product_title: missing_parts.append("title")
             # PPU might be optional for some items, don't fail on it unless required
             # if not ppu_price: missing_parts.append("price-per-unit")
             if not quantity: missing_parts.append("quantity")
             if not item_size_value: missing_parts.append("item_size_value")
             if not item_measurement: missing_parts.append("item_measurement")
             if missing_parts: # Only print warning if something essential is missing
                 print(f"{log_prefix} WARN: Missing essential data: {', '.join(missing_parts)}", file=sys.stderr)

    except WebDriverException as e:
        print(f"{log_prefix} WebDriver error for {link_url}: {type(e).__name__}", file=sys.stderr)
    except Exception as e:
        print(f"{log_prefix} Unexpected error for {link_url}: {type(e).__name__} - {e}", file=sys.stderr)
    finally:
        # --- Driver Cleanup ---
        if driver:
            print(f"{log_prefix} Quitting WebDriver.")
            driver.quit()

    duration = time.time() - start_time
    # Updated status check - focus on essential fields
    status = "Success" if product_title and quantity and item_size_value and item_measurement else "Partial/Failed"
    # Updated log message to show all 6 values clearly
    print(f"{log_prefix} Finished Orchestration | Status: {status} | Time: {duration:.2f}s | "
          f"Title: '{product_title}' | PPU: {ppu_price} €/{ppu_unit} | "
          f"Qty: {quantity} | Item Size: {item_size_value} {item_measurement} | " # <-- Updated log format
          f"URL: {link_url}")

    # Return all extracted pieces of information in the defined order
    return product_title, ppu_price, ppu_unit, quantity, item_size_value, item_measurement # <-- Updated return

# --- Example Usage ---
if __name__ == "__main__":
    # Using the same diverse set of test URLs
    test_url_kg = "https://www.alcampo.es/compra-online/frescos/frutas/frutas-de-hueso/melocoton-rojo-a-granel-1-kg-aprox/p/821701"
    test_url_g = "https://www.alcampo.es/compra-online/frescos/charcuteria/jamon-cocido-y-fiambres/pechuga-de-pavo-finas-lonchas-campofrío-pechuga-de-pavo-en-lonchas-finas-110-g/p/7650"
    test_url_unit_cl = "https://www.alcampo.es/compra-online/bebidas/refrescos/refrescos-de-cola/coca-cola-zero-refresco-de-cola-lata-33-cl/p/7584" # Single 33 cl can
    test_url_pack_g = "https://www.alcampo.es/compra-online/lacteos-huevos-y-postres/yogures-y-postres-lacteos/yogures-naturales-y-sabor-limon/activia-natural-danone-pack-4-unidades-de-120-g/p/5041" # Pack 4 x 120 g
    test_url_l = "https://www.alcampo.es/compra-online/bebidas/zumos/zumos-de-frutas/zumo-de-naranja-sin-pulpa-refrigerado-don-simón-1-l/p/14093" # Single 1 L item
    test_url_pack_unit = "https://www.alcampo.es/compra-online/bebe/alimentacion/leches-infantiles/leche-de-crecimiento-junior-1-ano-central-lechera-asturiana-pack-6-unidades-de-1-l/p/14102" # Example: Pack 6 x 1 L

    urls_to_test = {
        "KG Aprox": test_url_kg,
        "Grams": test_url_g,
        "Single CL": test_url_unit_cl,
        "Pack (Grams)": test_url_pack_g,
        "Liter": test_url_l,
        "Pack (Liter)": test_url_pack_unit,
    }

    print("Running example orchestration (Title, PPU, Qty, Item Size)...")

    for name, url in urls_to_test.items():
        print(f"\n--- Testing URL ({name}): {url} ---")
        # Call the main function and unpack all 6 results
        title, ppu, ppu_u, qty, item_size, item_unit = scrape_product_details(url, worker_id=1)

        # Print results clearly
        print(f"\nExample Result ({name}):")
        print(f"  Title    : {title if title else 'Failed'}")
        print(f"  PPU      : {f'{ppu} €/{ppu_u}' if ppu is not None and ppu_u is not None else 'Failed'}")
        print(f"  Quantity : {qty if qty is not None else 'Failed'}")
        print(f"  Item Size: {f'{item_size} {item_unit}' if item_size is not None and item_unit is not None else 'Failed'}")