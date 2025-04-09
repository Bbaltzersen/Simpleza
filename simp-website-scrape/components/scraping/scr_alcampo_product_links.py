# component/scraping/scr_alcampo_product_links_incremental.py

import time
import sys
import datetime
import uuid # Keep uuid import for potential future use, even if default handles it now
import os

# --- Database Imports ---
from database.connection import SessionLocal
from models.alcampo_product_link import Alcampo_Product_Link # Uses the updated model name
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

# --- Selenium Imports ---
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
# from selenium.webdriver.chrome.service import Service # If needed


# --- Database Handling Function ---
# CORRECT for UUID model with default=uuid.uuid4
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
        # After commit, product_link.product_link_id will contain the generated UUID
        db.refresh(product_link)
        print(f"  DB_ADD: Successfully committed (ID: {product_link.product_link_id}): {link}")
        return product_link
    except Exception as e:
        db.rollback()
        print(f"  DB_ERROR: Failed to add '{name}' ({link}). Error: {e}", file=sys.stderr)
        return None

# --- Configuration ---
TARGET_URL = "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation"
BASE_URL = "https://www.compraonline.alcampo.es"
SCROLL_PAUSE_TIME = 3
SCROLL_INCREMENT = 600
MAX_NO_NEW_LINKS_STREAK = 40
MAX_SCROLL_ATTEMPTS = 200

# --- Main Scraping Function ---
def scrape_alcampo_incrementally(url: str) -> tuple[int, int, int]:
    """
    Scrapes Alcampo category page, handles virtual scroll, adds NEW links to DB (UUID PK).

    Args:
        url: The URL of the Alcampo category page.

    Returns:
        A tuple containing:
        - newly_added_to_db_count: Count of links successfully ADDED to DB this run.
        - total_unique_links_found_this_run: Count of unique links found (excluding DB pre-load).
        - final_verification_count: Sum of rendered product cards + skeleton
          cards found in the DOM at the very end.
    """
    links_in_db_at_start = set()
    found_links_this_run = set()
    newly_added_to_db_count = 0
    final_rendered_cards = 0
    final_skeleton_cards = 0
    driver = None
    db: Session | None = None

    # Selectors
    product_card_selector = "div[data-retailer-anchor='fop']"
    skeleton_selector = 'div[data-retailer-anchor="fop-skeleton"]'
    name_selector_within_card = "h3[data-test='fop-title']"
    link_selector_within_card = "a[data-test='fop-product-link']"

    try:
        # --- Get DB Session & Pre-load ---
        print("Connecting to database...")
        db = SessionLocal()
        print("Database session established.")
        print("Loading existing links from database...")
        try:
            # Query uses the correct model name now
            existing_links_query = db.query(Alcampo_Product_Link.product_link).all()
            links_in_db_at_start = {link for (link,) in existing_links_query}
            print(f"Loaded {len(links_in_db_at_start)} existing links from DB.")
        except Exception as e:
            print(f"ERROR: Could not load existing links from DB: {e}", file=sys.stderr)
            print("WARNING: Proceeding without checking against existing DB links.")

        # --- Initialize WebDriver ---
        print("Initializing WebDriver...")
        driver = webdriver.Chrome()
        print("WebDriver initialized successfully.")
        driver.maximize_window()

        print(f"Navigating to: {url}")
        driver.get(url)

        # --- Handle Cookie Banner ---
        try:
            print("Waiting for cookie consent banner...")
            cookie_button_selector = "#onetrust-accept-btn-handler"
            cookie_button = WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, cookie_button_selector))
            )
            cookie_button.click()
            print("Cookie banner accepted.")
            time.sleep(2)
        except TimeoutException:
            print("Cookie consent banner not found or timed out.")
        except Exception as e:
            print(f"An error occurred while handling the cookie banner: {e}")


        # --- Incremental Scroll and Scan ---
        print(f"Starting incremental scroll and scan (scroll {SCROLL_INCREMENT}px, wait {SCROLL_PAUSE_TIME}s)...")
        scroll_attempts = 0
        no_new_links_streak = 0

        print("\n--- Processing Products (Incremental Scan + DB Add) ---")
        while scroll_attempts < MAX_SCROLL_ATTEMPTS:
            scroll_attempts += 1
            time.sleep(0.5)
            print(f"\nScroll Attempt {scroll_attempts}: Processing current view...")

            links_found_before_scan = len(found_links_this_run)

            # Find currently rendered product cards
            try:
                current_cards = driver.find_elements(By.CSS_SELECTOR, product_card_selector)
                print(f"  Found {len(current_cards)} potential cards currently in DOM.")
            except Exception as e:
                print(f"  Error finding cards in attempt {scroll_attempts}: {e}")
                current_cards = []

            if not current_cards and scroll_attempts > 1:
                 print("  No product cards found in current view/DOM state.")


            # Process the cards found in this view
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

                    # Process only if link is new for THIS RUN
                    if absolute_link != "N/A" and "Invalid Link Format" not in absolute_link and absolute_link not in found_links_this_run:
                        new_items_processed_this_scan += 1
                        found_links_this_run.add(absolute_link)

                        # Check if it's also new compared to DB start state
                        if absolute_link not in links_in_db_at_start:
                            print(f"  (+) New Link Found: {absolute_link}")
                            # Attempt to get name and add to DB
                            try:
                                name_element = card.find_element(By.CSS_SELECTOR, name_selector_within_card)
                                product_name = name_element.text.strip()

                                if product_name and product_name != "N/A":
                                    # Call the database function (which uses the correct model now)
                                    added_product = create_product_link(db, product_name, absolute_link)
                                    if added_product:
                                        newly_added_to_db_count += 1
                                else:
                                    print(f"  (!) Skipping DB add for {absolute_link}: Invalid product name found.")

                            except NoSuchElementException:
                                 print(f"  (!) Skipping DB add for {absolute_link}: Name element not found in card.")
                            except Exception as ne:
                                 print(f"  (!) Skipping DB add for {absolute_link}: Error getting name - {ne}")
                        # else: (Link already in DB) - No action needed


                except NoSuchElementException:
                     pass # Ignore cards missing link element
                except Exception as e:
                    print(f"  ERROR processing a card element: {e}. Skipping.", file=sys.stderr)

            print(f"  Processed {new_items_processed_this_scan} unique links in this scan iteration.")
            print(f"  Total unique links found this run so far: {len(found_links_this_run)}")
            print(f"  Total items added to DB this run so far: {newly_added_to_db_count}")


            # --- Scroll Down ---
            last_scroll_y = driver.execute_script("return window.scrollY")
            driver.execute_script(f"window.scrollBy(0, {SCROLL_INCREMENT});")
            print(f"  Scrolling down {SCROLL_INCREMENT}px...")
            time.sleep(SCROLL_PAUSE_TIME)
            new_scroll_y = driver.execute_script("return window.scrollY")

            # --- Check Stop Conditions ---
            if new_scroll_y <= last_scroll_y:
                print(f"\nScroll position did not increase (Before: {last_scroll_y}, After: {new_scroll_y}). Stopping.")
                break

            if new_items_processed_this_scan == 0:
                no_new_links_streak += 1
                print(f"\nNo new unique links processed after scroll ({no_new_links_streak}/{MAX_NO_NEW_LINKS_STREAK}).")
                if no_new_links_streak >= MAX_NO_NEW_LINKS_STREAK:
                    print("\nReached max streak of scrolls with no new links processed. Stopping.")
                    break
            else:
                no_new_links_streak = 0

        # --- End of while loop ---
        if scroll_attempts == MAX_SCROLL_ATTEMPTS:
            print(f"\nWARNING: Reached maximum scroll attempts ({MAX_SCROLL_ATTEMPTS}).")

        print(f"\n--- End of Scrolling and Processing Phase ---")

        # --- Final Verification Count ---
        print("Performing final verification count of rendered elements...")
        try:
            final_rendered_cards_list = driver.find_elements(By.CSS_SELECTOR, product_card_selector)
            final_rendered_cards = len(final_rendered_cards_list)
            print(f"  Found {final_rendered_cards} fully rendered product cards in final DOM state.")
        except Exception as e:
            print(f"  Error finding final product cards: {e}")
            final_rendered_cards = -1
        try:
            final_skeleton_cards_list = driver.find_elements(By.CSS_SELECTOR, skeleton_selector)
            final_skeleton_cards = len(final_skeleton_cards_list)
            print(f"  Found {final_skeleton_cards} skeleton cards in final DOM state.")
        except Exception as e:
            print(f"  Error finding final skeleton cards: {e}")
            final_skeleton_cards = -1
        final_verification_count = -1
        if final_rendered_cards != -1 and final_skeleton_cards != -1:
            final_verification_count = final_rendered_cards + final_skeleton_cards
            print(f"  Final Verification Count (Rendered + Skeletons): {final_verification_count}")
        else:
            print("  Could not perform final verification count due to errors.")


    except WebDriverException as e:
        print(f"\nA WebDriver error occurred: {e}", file=sys.stderr)
        # (Standard WebDriver error handling)
        print("Please ensure ChromeDriver is installed and accessible in your system's PATH,", file=sys.stderr)
        print("or specify the path using webdriver.Chrome(service=Service(executable_path='/path/to/chromedriver')).", file=sys.stderr)
        print("Also check Chrome browser compatibility with ChromeDriver version.", file=sys.stderr)

    except Exception as e:
        print(f"\nAn unexpected error occurred during scraping: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

    finally:
        # Close resources
        if driver:
            print("Closing WebDriver...")
            driver.quit()
            print("WebDriver closed.")
        if db:
            print("Closing database session...")
            db.close()
            print("Database session closed.")

    # Return counts
    return newly_added_to_db_count, len(found_links_this_run), final_verification_count

# --- Execution ---
if __name__ == "__main__":
    start_time = time.time()
    print(f"--- Starting Alcampo Incremental Scraper with DB Add (UUID PK) ---") # Updated title
    print(f"Start Time: {datetime.datetime.now()}")
    print(f"Target URL: {TARGET_URL}")
    print(f"Scroll Increment: {SCROLL_INCREMENT}px, Pause: {SCROLL_PAUSE_TIME}s")
    print(f"Stop Streak: {MAX_NO_NEW_LINKS_STREAK}, Max Scrolls: {MAX_SCROLL_ATTEMPTS}")
    print("-" * 60)

    db_added_count, total_unique_this_run, verification_total = scrape_alcampo_incrementally(TARGET_URL)

    print("-" * 60)
    end_time = time.time()
    duration = end_time - start_time
    print("\n--- Scraping Summary ---")
    print(f"NEW links successfully ADDED to Database: {db_added_count}")
    print(f"Total unique links FOUND during this run: {total_unique_this_run}")
    if verification_total != -1:
        print(f"Final DOM State Check: {verification_total} (Rendered Cards + Skeletons)")
    else:
        print(f"Final DOM state check encountered errors.")
    print(f"Script execution duration: {duration:.2f} seconds")
    print(f"End Time: {datetime.datetime.now()}")
    print(f"--- Scraper finished ---")