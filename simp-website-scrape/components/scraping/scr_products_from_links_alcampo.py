# components/scraping/scr_product_details_from_links_alcampo.py

import time
import sys
import os
from decimal import Decimal # Import Decimal as it's returned by price helper

# --- Import helper functions ---
from components.scraping.product_helper_functions.title import extract_title
from components.scraping.product_helper_functions.price import extract_price_per_unit

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
# Renamed function to better reflect its purpose
def scrape_product_details(link_url: str, worker_id: int = 0) -> tuple[str | None, Decimal | None, str | None]:
    """
    Orchestrates the extraction of product details (title, price per unit)
    from an Alcampo product page URL by calling helper functions.

    Args:
        link_url: The URL of the product page.
        worker_id: An optional ID used for profile directory naming and logging.

    Returns:
        A tuple containing:
         - Product title (str | None)
         - Price Per Unit (Decimal | None)
         - Price Per Unit's Unit (str | None) e.g. 'kg', 'l', 'unit'
    """
    start_time = time.time()
    # Initialize result variables
    product_title: str | None = None
    ppu_price: Decimal | None = None
    ppu_unit: str | None = None
    driver: webdriver.Chrome | None = None # Type hint driver
    log_prefix = f"[Orchestrator Worker {worker_id:02d}]"

    print(f"{log_prefix} Starting processing for: {link_url}")

    try:
        # --- WebDriver Setup ---
        # (WebDriver setup code remains the same)
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-gpu")
        # options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})
        options.add_argument("--blink-settings=imagesEnabled=false")

        if USE_SEPARATE_PROFILES:
            profile_path = os.path.abspath(os.path.join(PROFILE_BASE_DIR, f"profile_orch_{worker_id}"))
            os.makedirs(profile_path, exist_ok=True)
            options.add_argument(f"--user-data-dir={profile_path}")
            # print(f"{log_prefix} Using profile: {profile_path}")

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
            return None, None, None # Return tuple indicating failure
        time.sleep(2) # Allow dynamic content a moment

        # --- Handle Cookies (Best Effort) ---
        # (Cookie handling code remains the same)
        try:
            print(f"{log_prefix} Checking for cookie button...")
            cookie_button = WebDriverWait(driver, 5).until( EC.element_to_be_clickable((By.CSS_SELECTOR, COOKIE_BUTTON_SELECTOR)) )
            try:
                cookie_button.click()
                print(f"{log_prefix} Clicked cookie button.")
            except ElementClickInterceptedException:
                driver.execute_script("arguments[0].click();", cookie_button)
                print(f"{log_prefix} Clicked cookie button via JS.")
            time.sleep(0.5)
        except Exception:
            print(f"{log_prefix} Cookie button not found or clickable within timeout.")
            pass

        # --- Call Extraction Helpers ---
        print(f"{log_prefix} Calling title extraction helper...")
        product_title = extract_title(driver, worker_id)

        print(f"{log_prefix} Calling price-per-unit extraction helper...")
        ppu_price, ppu_unit = extract_price_per_unit(driver, worker_id)

        # --- Placeholder for calling other future helpers ---
        # e.g., main_price = extract_main_price(driver, worker_id)
        # e.g., size, unit = extract_size_info(driver, worker_id)
        # ... etc ...

        # --- Final Check (Optional - can be done by the caller) ---
        if not product_title or not ppu_price:
             # Log if key information is missing, helpers should log specifics
             missing_parts = []
             if not product_title: missing_parts.append("title")
             if not ppu_price: missing_parts.append("price-per-unit")
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
    # Status could be more sophisticated, e.g., checking if both title and ppu were found
    status = "Success" if product_title and ppu_price else "Partial/Failed"
    print(f"{log_prefix} Finished Orchestration | Status: {status} | Time: {duration:.2f}s | "
          f"Title: '{product_title}' | PPU: {ppu_price} €/{ppu_unit} | URL: {link_url}")

    # Return all extracted pieces of information
    return product_title, ppu_price, ppu_unit

# --- Example Usage ---
if __name__ == "__main__":
    # Example Alcampo product URL (replace with a current one if needed)
    # This one usually has a clear price per kg
    test_url = "https://www.alcampo.es/compra-online/frescos/frutas/frutas-de-hueso/melocoton-rojo-a-granel-1-kg-aprox/p/821701"
    # This one might have price per unit
    # test_url_unit = "https://www.alcampo.es/compra-online/bebidas/refrescos/refrescos-de-cola/coca-cola-zero-refresco-de-cola-lata-33-cl/p/7584"
    # test_url_broken = "https://www.alcampo.es/compra-online/frescos/frutas/NONEXISTENT/p/999999"

    print("Running example orchestration (Title and PPU)...")
    # Call the renamed main function
    title, ppu, ppu_unit_name = scrape_product_details(test_url, worker_id=1)

    print("\nExample Result:")
    if title:
        print(f"  Successfully extracted title -> '{title}'")
    else:
        print("  Failed to extract title.")

    if ppu is not None and ppu_unit_name is not None:
         print(f"  Successfully extracted PPU -> {ppu} €/{ppu_unit_name}")
    else:
         print(f"  Failed to extract explicit Price Per Unit.")

    # print("\nRunning example with potentially broken link...")
    # title_b, ppu_b, unit_b = scrape_product_details(test_url_broken, worker_id=98)
    # print("\nExample Result (Broken Link):")
    # print(f"  Title: {title_b}")
    # print(f"  PPU: {ppu_b} €/{unit_b}")