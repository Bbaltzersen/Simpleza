# components/scraping/scr_product_details_from_links_alcampo.py

import time
import sys
import os
from typing import Tuple, Optional # Import typing helpers
from decimal import Decimal # Needed for return types from helpers

# --- Import helper functions ---
from components.scraping.product_helper_functions.title import extract_title
from components.scraping.product_helper_functions.price import extract_price_per_unit
from components.scraping.product_helper_functions.size_info import extract_size_info
# Import the new helper for size deviation
from components.scraping.product_helper_functions.size_deviation import extract_size_deviation

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
# Updated function signature and docstring for 8 return values
def scrape_product_details(link_url: str, worker_id: int = 0) -> Tuple[
    Optional[str], Optional[Decimal], Optional[str], Optional[int],
    Optional[Decimal], Optional[str], Optional[int], Optional[int]
]:
    """
    Orchestrates the extraction of product details (title, PPU, quantity,
    item size, size deviation) from an Alcampo product page URL by calling
    helper functions.

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
         - min_weight_g (int | None): Minimum weight in grams for variable weight items.
         - max_weight_g (int | None): Maximum weight in grams for variable weight items.
    """
    start_time = time.time()
    # Initialize result variables matching the return tuple
    product_title: Optional[str] = None
    ppu_price: Optional[Decimal] = None
    ppu_unit: Optional[str] = None
    quantity: Optional[int] = None
    item_size_value: Optional[Decimal] = None
    item_measurement: Optional[str] = None
    min_weight_g: Optional[int] = None # <-- New result variable
    max_weight_g: Optional[int] = None # <-- New result variable
    driver: Optional[webdriver.Chrome] = None
    log_prefix = f"[Orchestrator Worker {worker_id:02d}]"

    print(f"{log_prefix} Starting processing for: {link_url}")

    try:
        # --- WebDriver Setup ---
        # (Setup code remains the same)
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
        # (Navigation code remains the same)
        print(f"{log_prefix} Navigating to URL...")
        driver.get(link_url)
        try:
            WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, BODY_SELECTOR)))
            print(f"{log_prefix} Page body loaded.")
        except TimeoutException:
            print(f"{log_prefix} ERROR: Page body did not load within 30 seconds.", file=sys.stderr)
            if driver: driver.quit()
            return None, None, None, None, None, None, None, None # Return 8 Nones

        time.sleep(2) # Allow dynamic content


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
        quantity_dec, item_size_value, item_measurement = extract_size_info(driver, worker_id)
        # Convert quantity from Decimal (if returned by parser) to Int
        if quantity_dec is not None:
            try: quantity = int(quantity_dec)
            except (ValueError, TypeError):
                 print(f"{log_prefix} WARN: Could not convert extracted quantity '{quantity_dec}' to integer.", file=sys.stderr)
                 quantity = None
        else: quantity = None

        print(f"{log_prefix} Calling size deviation extraction helper...") # <-- Log new step
        min_weight_g, max_weight_g = extract_size_deviation(driver, worker_id) # <-- Call new helper


        # --- Placeholder for other helpers ---
        # e.g., main_price = extract_main_price(driver, worker_id)

        # --- Final Check (Optional) ---
        # (Check logic remains similar, focusing on essential fields)
        if not product_title or not quantity or not item_size_value or not item_measurement:
             missing_parts = []
             if not product_title: missing_parts.append("title")
             if not quantity: missing_parts.append("quantity")
             if not item_size_value: missing_parts.append("item_size_value")
             if not item_measurement: missing_parts.append("item_measurement")
             # Note: min/max weight are optional, so not included in this essential check
             if missing_parts:
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
    # Status check focuses on essentials
    status = "Success" if product_title and quantity and item_size_value and item_measurement else "Partial/Failed"
    # Build final log string dynamically
    log_details = [
        f"Title: '{product_title}'",
        f"PPU: {ppu_price} €/{ppu_unit}",
        f"Qty: {quantity}",
        f"Item Size: {item_size_value} {item_measurement}",
    ]
    # Add deviation only if found
    if min_weight_g is not None and max_weight_g is not None:
        log_details.append(f"Deviation: {min_weight_g}g-{max_weight_g}g")

    print(f"{log_prefix} Finished Orchestration | Status: {status} | Time: {duration:.2f}s | "
          f"{' | '.join(log_details)} | URL: {link_url}")

    # Return all 8 extracted pieces of information
    return product_title, ppu_price, ppu_unit, quantity, item_size_value, item_measurement, min_weight_g, max_weight_g # <-- Updated return

# --- Example Usage ---
if __name__ == "__main__":
    # Add a URL likely to have weight range (needs verification on current site)
    # Fresh fish/meat sections are good candidates
    test_url_deviation_example = "https://www.alcampo.es/compra-online/frescos/pescaderia/pescado-fresco/dorada-de-estero-calidad-y-origen-alcampo-pieza-de-400-g-a-600-g-aprox/p/821747" # Example Dorada

    urls_to_test = {
        "KG Aprox": "https://www.alcampo.es/compra-online/frescos/frutas/frutas-de-hueso/melocoton-rojo-a-granel-1-kg-aprox/p/821701",
        "Grams": "https://www.alcampo.es/compra-online/frescos/charcuteria/jamon-cocido-y-fiambres/pechuga-de-pavo-finas-lonchas-campofrío-pechuga-de-pavo-en-lonchas-finas-110-g/p/7650",
        "Single CL": "https://www.alcampo.es/compra-online/bebidas/refrescos/refrescos-de-cola/coca-cola-zero-refresco-de-cola-lata-33-cl/p/7584",
        "Pack (Grams)": "https://www.alcampo.es/compra-online/lacteos-huevos-y-postres/yogures-y-postres-lacteos/yogures-naturales-y-sabor-limon/activia-natural-danone-pack-4-unidades-de-120-g/p/5041",
        "Liter": "https://www.alcampo.es/compra-online/bebidas/zumos/zumos-de-frutas/zumo-de-naranja-sin-pulpa-refrigerado-don-simón-1-l/p/14093",
        "Pack (Liter)": "https://www.alcampo.es/compra-online/bebe/alimentacion/leches-infantiles/leche-de-crecimiento-junior-1-ano-central-lechera-asturiana-pack-6-unidades-de-1-l/p/14102",
        "Deviation Example": test_url_deviation_example, # Add the new test case
    }

    print("Running example orchestration (Title, PPU, Qty, Item Size, Deviation)...")

    for name, url in urls_to_test.items():
        print(f"\n--- Testing URL ({name}): {url} ---")
        # Call the main function and unpack all 8 results
        title, ppu, ppu_u, qty, item_size, item_unit, min_w, max_w = scrape_product_details(url, worker_id=1)

        # Print results clearly
        print(f"\nExample Result ({name}):")
        print(f"  Title    : {title if title else 'Failed'}")
        print(f"  PPU      : {f'{ppu} €/{ppu_u}' if ppu is not None and ppu_u is not None else 'Failed/Not Found'}")
        print(f"  Quantity : {qty if qty is not None else 'Failed'}")
        print(f"  Item Size: {f'{item_size} {item_unit}' if item_size is not None and item_unit is not None else 'Failed'}")
        # Only print deviation if found
        if min_w is not None and max_w is not None:
            print(f"  Deviation: {min_w}g - {max_w}g")
        else:
            print(f"  Deviation: Not Found")