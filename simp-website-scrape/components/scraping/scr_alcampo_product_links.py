# component/scraping/scr_alcampo_product_links_incremental.py

import time
import sys
import datetime
import uuid
import os

# Database Imports remain for type hinting and calling create_product_link
from models.alcampo_product_link import Alcampo_Product_Link
from sqlalchemy.orm import Session
# The actual 'create_product_link' function is assumed to be here or imported
# For clarity, let's redefine it here based on the last correct version
# (Ideally, this function lives in database/handling.py)

def create_product_link(db: Session, name: str, link: str) -> Alcampo_Product_Link | None:
    """Adds a new product link to the database, letting the model's default generate the UUID ID."""
    try:
        # Omit product_link_id - SQLAlchemy will use the 'default=uuid.uuid4' from the model
        product_link = Alcampo_Product_Link(
            product_name=name,
            product_link=link
        )
        db.add(product_link)
        db.commit()
        db.refresh(product_link)
        print(f"      DB_ADD: Successfully committed (ID: {product_link.product_link_id}): {link}")
        return product_link
    except Exception as e:
        db.rollback()
        # Consider catching specific IntegrityError for duplicate product_link
        print(f"      DB_ERROR: Failed to add '{name}' ({link}). Error: {e}", file=sys.stderr)
        return None


# Selenium Imports remain for type hinting and operations
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException

# --- Configuration (can be moved to main or a config file) ---
BASE_URL = "https://www.compraonline.alcampo.es" # Base URL still needed
SCROLL_PAUSE_TIME = 3
SCROLL_INCREMENT = 400
MAX_NO_NEW_LINKS_STREAK = 200 # High streak, consider tuning
MAX_SCROLL_ATTEMPTS = 200

# --- Refactored Scraping Function ---
def scrape_alcampo_incrementally(
    url: str,
    driver: webdriver.Chrome, # Accepts WebDriver instance
    db: Session,             # Accepts DB Session
    links_in_db_at_start: set # Accepts pre-loaded set of links
) -> tuple[int, int]:
    """
    Scrapes a single Alcampo category page URL using an existing WebDriver and DB session.

    Handles virtual scroll, adds NEW links (not in links_in_db_at_start) to the DB.

    Args:
        url: The specific Alcampo category URL to scrape.
        driver: An initialized Selenium WebDriver instance.
        db: An active SQLAlchemy Session.
        links_in_db_at_start: A set containing product_link strings already known
                              to be in the database before the main script started.

    Returns:
        A tuple containing:
        - newly_added_to_db_count: Count of links successfully ADDED to DB for THIS URL.
        - total_unique_links_found_this_url: Count of unique links found for THIS URL.
    """
    print(f"\n--- Starting scrape for URL: {url} ---")
    found_links_this_url = set() # Store unique links found for THIS URL during this call
    newly_added_to_db_count = 0

    # Selectors
    product_card_selector = "div[data-retailer-anchor='fop']"
    skeleton_selector = 'div[data-retailer-anchor="fop-skeleton"]' # Kept for potential debugging
    name_selector_within_card = "h3[data-test='fop-title']"
    link_selector_within_card = "a[data-test='fop-product-link']"

    try:
        # --- Navigate & Handle Cookies (using provided driver) ---
        print(f"  Navigating to: {url}")
        driver.get(url)
        time.sleep(2) # Allow initial page load

        try:
            # Re-check for cookie banner on each page load? Or handle once in main?
            # Let's assume it might reappear or be needed per category page.
            print("  Checking for cookie consent banner...")
            cookie_button_selector = "#onetrust-accept-btn-handler"
            # Use shorter wait time if it's not always expected
            cookie_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, cookie_button_selector))
            )
            cookie_button.click()
            print("  Cookie banner accepted.")
            time.sleep(1) # Brief pause after click
        except TimeoutException:
            print("  Cookie consent banner not found or timed out (might be already accepted).")
        except Exception as e:
            print(f"  An error occurred while handling the cookie banner for this URL: {e}")

        # --- Incremental Scroll and Scan ---
        print(f"  Starting incremental scroll (scroll {SCROLL_INCREMENT}px, wait {SCROLL_PAUSE_TIME}s)...")
        scroll_attempts = 0
        no_new_links_streak = 0

        while scroll_attempts < MAX_SCROLL_ATTEMPTS:
            scroll_attempts += 1
            time.sleep(0.5) # Small pause before processing view
            print(f"    Scroll Attempt {scroll_attempts}: Processing current view...")

            links_found_before_scan = len(found_links_this_url)

            try:
                current_cards = driver.find_elements(By.CSS_SELECTOR, product_card_selector)
                # print(f"      Found {len(current_cards)} potential cards currently in DOM.") # Reduce noise
            except Exception as e:
                print(f"      Error finding cards in attempt {scroll_attempts}: {e}")
                current_cards = []

            if not current_cards and scroll_attempts > 1:
                 print("      No product cards found in current view/DOM state.")

            new_items_processed_this_scan = 0
            for card in current_cards:
                absolute_link = "N/A"
                relative_link = "N/A"
                try:
                    link_element = card.find_element(By.CSS_SELECTOR, link_selector_within_card)
                    relative_link = link_element.get_attribute('href')

                    if relative_link:
                        if relative_link.startswith('/'):
                            absolute_link = BASE_URL + relative_link
                        elif relative_link.startswith('http'):
                            absolute_link = relative_link
                        else:
                            absolute_link = "Invalid Link Format"

                    # Process only if link is new for THIS URL scrape
                    if absolute_link != "N/A" and "Invalid Link Format" not in absolute_link and absolute_link not in found_links_this_url:
                        new_items_processed_this_scan += 1
                        found_links_this_url.add(absolute_link) # Add to this URL's set

                        # Check if it's also new compared to DB start state
                        if absolute_link not in links_in_db_at_start:
                            # print(f"      (+) New Link Found (for DB): {absolute_link}") # Reduce noise
                            try:
                                name_element = card.find_element(By.CSS_SELECTOR, name_selector_within_card)
                                product_name = name_element.text.strip()

                                if product_name and product_name != "N/A":
                                    # Call the database function (passing existing session)
                                    added_product = create_product_link(db, product_name, absolute_link)
                                    if added_product:
                                        newly_added_to_db_count += 1
                                else:
                                     print(f"      (!) Skipping DB add for {absolute_link}: Invalid product name found.")
                            except NoSuchElementException:
                                 print(f"      (!) Skipping DB add for {absolute_link}: Name element not found.")
                            except Exception as ne:
                                 print(f"      (!) Skipping DB add for {absolute_link}: Error getting name - {ne}")
                        # else: Link existed in DB at start

                except NoSuchElementException:
                     pass # Ignore cards missing link element
                except Exception as e:
                    print(f"      ERROR processing a card element: {e}. Skipping.", file=sys.stderr)

            # print(f"      Processed {new_items_processed_this_scan} unique links in scan.") # Reduce noise
            # print(f"      Total unique found for this URL: {len(found_links_this_url)}")
            # print(f"      Total added to DB for this URL: {newly_added_to_db_count}")


            # --- Scroll Down ---
            last_scroll_y = driver.execute_script("return window.scrollY")
            driver.execute_script(f"window.scrollBy(0, {SCROLL_INCREMENT});")
            # print(f"      Scrolling down {SCROLL_INCREMENT}px...") # Reduce noise
            time.sleep(SCROLL_PAUSE_TIME)
            new_scroll_y = driver.execute_script("return window.scrollY")

            # --- Check Stop Conditions ---
            if new_scroll_y <= last_scroll_y:
                print(f"    Scroll position did not increase. Assuming end for {url}.")
                break

            if new_items_processed_this_scan == 0:
                no_new_links_streak += 1
                # print(f"    No new unique links processed ({no_new_links_streak}/{MAX_NO_NEW_LINKS_STREAK}).") # Reduce noise
                if no_new_links_streak >= MAX_NO_NEW_LINKS_STREAK:
                    print(f"    Reached max streak ({MAX_NO_NEW_LINKS_STREAK}) with no new links. Stopping for {url}.")
                    break
            else:
                no_new_links_streak = 0

        if scroll_attempts == MAX_SCROLL_ATTEMPTS:
            print(f"    WARNING: Reached max scroll attempts ({MAX_SCROLL_ATTEMPTS}) for {url}.")

        print(f"--- Finished scrape for URL: {url} ---")
        print(f"    Found {len(found_links_this_url)} unique links for this URL.")
        print(f"    Added {newly_added_to_db_count} new links to DB for this URL.")

    except WebDriverException as e:
         # Log WebDriver errors specific to this URL, but allow main script to continue?
         print(f"\n--- WebDriver ERROR occurred while scraping {url} ---", file=sys.stderr)
         print(f"    Error: {e}", file=sys.stderr)
         # Optionally re-raise if the error is critical: raise e
    except Exception as e:
        print(f"\n--- An unexpected error occurred while scraping {url} ---", file=sys.stderr)
        print(f"    Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc() # Print traceback for debugging specific URL errors
        # Optionally re-raise: raise e

    # Return counts for THIS URL
    return newly_added_to_db_count, len(found_links_this_url)

# Note: The main execution block (if __name__ == "__main__":) is removed
# as this script is now intended to be imported and called from main.py