# components/scraping/scr_alcampo_product_links_worker.py

import time
import sys
import datetime
import uuid
import os

# Database Imports
from database.connection import SessionLocal
from models.alcampo_product_link import Alcampo_Product_Link
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError # Import IntegrityError

# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, TimeoutException, WebDriverException, ElementClickInterceptedException
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service # If using explicit path

# --- Worker Configuration ---
BASE_URL = "https://www.compraonline.alcampo.es"
SCROLL_PAUSE_TIME = 3
SCROLL_INCREMENT = 600
MAX_NO_NEW_LINKS_STREAK = 5 # Lowered streak
MAX_SCROLL_ATTEMPTS = 200
# Set path if needed, otherwise leave as None
CHROMEDRIVER_PATH = None # Example: "/usr/local/bin/chromedriver" or "C:/path/to/chromedriver.exe"
# Control profile usage
USE_SEPARATE_PROFILES = True
PROFILE_BASE_DIR = "./chrome_profiles" # Will be created if it doesn't exist

# --- Database Handling Function ---
def create_product_link(db: Session, name: str, link: str) -> Alcampo_Product_Link | None:
    """Adds a new product link to the database, letting the model's default generate the UUID ID."""
    try:
        product_link = Alcampo_Product_Link(product_name=name, product_link=link)
        db.add(product_link)
        db.commit()
        db.refresh(product_link)
        # print(f"      DB_ADD: (ID: {product_link.product_link_id}): {link}") # Keep logging minimal from worker
        return product_link
    except IntegrityError: # Specifically catch unique constraint violations
         db.rollback()
         # print(f"      DB_INFO: Link already exists '{link}'. Skipping.") # Optional info log
         return None # Not an error, just already exists
    except SQLAlchemyError as e:
        db.rollback()
        print(f"      DB_ERROR: SQLAlchemyError for '{name}' ({link}). Error: {e}", file=sys.stderr)
        return None
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        print(f"      DB_ERROR: Unexpected error for '{name}' ({link}). Error: {e}", file=sys.stderr)
        return None

# --- Worker Function ---
def worker_scrape_url(url: str, links_in_db_at_start: set, worker_id: int) -> tuple[str, int, int]:
    """
    Worker function executed by each process.
    Initializes its own WebDriver and DB Session, scrapes one URL.
    Args and Returns documented in main.py where it's called.
    """
    print(f"[Worker {worker_id:02d}] Starting URL: {url}") # Padded ID for alignment
    start_time = time.time()
    found_links_this_url = set()
    newly_added_to_db_count = 0

    driver = None
    db = None

    # Selectors
    product_card_selector = "div[data-retailer-anchor='fop']"
    name_selector_within_card = "h3[data-test='fop-title']"
    link_selector_within_card = "a[data-test='fop-product-link']"

    try:
        # --- Initialize WebDriver ---
        options = Options()
        # Common options for stability / headless:
        options.add_argument("--no-sandbox") # Often needed in containerized/linux environments
        options.add_argument("--disable-dev-shm-usage") # Overcomes limited resource problems
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-gpu") # Often needed for headless
        options.add_argument("--headless=new") # Recommended headless mode
        options.add_argument("--window-size=1920,1080") # Define window size for consistency

        if USE_SEPARATE_PROFILES:
            profile_path = os.path.abspath(os.path.join(PROFILE_BASE_DIR, f"profile_{worker_id}"))
            os.makedirs(profile_path, exist_ok=True)
            options.add_argument(f"--user-data-dir={profile_path}")

        service = None
        if CHROMEDRIVER_PATH and os.path.exists(CHROMEDRIVER_PATH):
            service = Service(executable_path=CHROMEDRIVER_PATH)
        elif CHROMEDRIVER_PATH:
             print(f"[Worker {worker_id:02d}] WARNING: CHROMEDRIVER_PATH specified but not found: {CHROMEDRIVER_PATH}. Trying system PATH.", file=sys.stderr)


        driver = webdriver.Chrome(service=service, options=options)

        # --- Initialize DB Session ---
        db = SessionLocal()

        # --- Navigate & Handle Cookies ---
        driver.get(url)
        time.sleep(2) # Allow rendering after load
        try:
            cookie_button_selector = "#onetrust-accept-btn-handler"
            cookie_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, cookie_button_selector))
            )
            cookie_button.click()
            time.sleep(1)
        except TimeoutException: pass # Assume okay if not found
        except ElementClickInterceptedException:
             print(f"[Worker {worker_id:02d}] WARN: Cookie button click intercepted for {url}. Trying JS click.")
             try:
                 driver.execute_script("arguments[0].click();", cookie_button)
                 time.sleep(1)
             except Exception as js_e: print(f"[Worker {worker_id:02d}] ERROR: JS click failed: {js_e}")
        except Exception as e: print(f"[Worker {worker_id:02d}] WARN: Cookie banner error: {e}")

        # --- Incremental Scroll and Scan ---
        scroll_attempts = 0
        no_new_links_streak = 0

        while scroll_attempts < MAX_SCROLL_ATTEMPTS:
            scroll_attempts += 1
            time.sleep(0.5)

            try:
                current_cards = driver.find_elements(By.CSS_SELECTOR, product_card_selector)
            except Exception as e:
                print(f"[Worker {worker_id:02d}] ERROR finding cards: {e}")
                current_cards = []

            new_items_processed_this_scan = 0
            for card in current_cards:
                absolute_link = "N/A"
                try:
                    link_element = card.find_element(By.CSS_SELECTOR, link_selector_within_card)
                    relative_link = link_element.get_attribute('href')
                    if relative_link:
                        if relative_link.startswith('/'): absolute_link = BASE_URL + relative_link
                        elif relative_link.startswith('http'): absolute_link = relative_link
                        else: absolute_link = "Invalid Link Format"

                    if absolute_link != "N/A" and "Invalid Link Format" not in absolute_link and absolute_link not in found_links_this_url:
                        new_items_processed_this_scan += 1
                        found_links_this_url.add(absolute_link)

                        if absolute_link not in links_in_db_at_start:
                            try:
                                name_element = card.find_element(By.CSS_SELECTOR, name_selector_within_card)
                                product_name = name_element.text.strip()
                                if product_name and product_name != "N/A":
                                    added_product = create_product_link(db, product_name, absolute_link)
                                    if added_product: newly_added_to_db_count += 1
                                else: pass # Invalid name
                            except NoSuchElementException: pass
                            except Exception as ne: print(f"[Worker {worker_id:02d}] ERROR getting name {absolute_link}: {ne}")

                except NoSuchElementException: pass
                except Exception as e: print(f"[Worker {worker_id:02d}] ERROR processing card: {e}")

            # --- Scroll Down ---
            last_scroll_y = driver.execute_script("return window.scrollY")
            driver.execute_script(f"window.scrollBy(0, {SCROLL_INCREMENT});")
            time.sleep(SCROLL_PAUSE_TIME)
            new_scroll_y = driver.execute_script("return window.scrollY")

            # --- Check Stop Conditions ---
            if new_scroll_y <= last_scroll_y: break
            if new_items_processed_this_scan == 0:
                no_new_links_streak += 1
                if no_new_links_streak >= MAX_NO_NEW_LINKS_STREAK: break
            else: no_new_links_streak = 0

        # End loop

    except WebDriverException as e:
        print(f"[Worker {worker_id:02d}] FATAL WebDriver error for URL {url}: {e}", file=sys.stderr)
        return url, -1, -1 # Indicate failure with negative counts
    except Exception as e:
        print(f"[Worker {worker_id:02d}] FATAL Unexpected error for URL {url}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return url, -1, -1 # Indicate failure
    finally:
        # --- Cleanup ---
        if driver:
            driver.quit()
        if db:
            db.close()

    duration = time.time() - start_time
    print(f"[Worker {worker_id:02d}] Finished URL: {url} | Added: {newly_added_to_db_count} | Found: {len(found_links_this_url)} | Time: {duration:.2f}s")
    return url, newly_added_to_db_count, len(found_links_this_url)