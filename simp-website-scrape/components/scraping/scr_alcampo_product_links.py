# main_scraper.py

import time
import sys
import datetime

# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException

# Database Imports from your modules
from sqlalchemy.orm import Session
from database.connection import SessionLocal, engine # Import Session factory and engine
from database.handling import create_product_link # Import your DB handling function
from models.alcampo_product_link import Base # Import Base for table creation

# --- Configuration ---
TARGET_URL = "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation"
BASE_URL = "https://www.compraonline.alcampo.es"

# --- Main Scraping Function (Using imported DB functions) ---
def scrape_alcampo_and_save_links(url: str, db: Session) -> tuple[int, int]:
    """
    Scrapes product names/links and saves them progressively using imported DB functions.

    Args:
        url: The URL of the Alcampo category page.
        db: The SQLAlchemy Session object.

    Returns:
        A tuple containing: (number_of_products_found, number_of_products_added)
    """
    processed_count = 0
    added_count = 0
    driver = None

    try:
        print("Initializing WebDriver (expecting ChromeDriver in system PATH)...")
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

        # --- Infinite Scroll ---
        print("Starting infinite scroll simulation...")
        last_height = driver.execute_script("return document.body.scrollHeight")
        scroll_attempts = 0
        max_scroll_attempts = 30 # Safety limit

        while scroll_attempts < max_scroll_attempts:
            scroll_attempts += 1
            print(f"Scrolling down... (Attempt {scroll_attempts})")
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3.5) # Adjust if needed
            new_height = driver.execute_script("return document.body.scrollHeight")
            print(f"  Current height: {new_height}, Previous height: {last_height}")
            if new_height == last_height:
                print("Scroll height hasn't changed. Performing final check...")
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(3.5)
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                   print("Height confirmed unchanged. Stopping scroll.")
                   break
                else:
                   print(f"Height changed after final check. Continuing. New height: {new_height}")
            last_height = new_height

        if scroll_attempts == max_scroll_attempts:
             print(f"WARNING: Reached maximum scroll attempts ({max_scroll_attempts}).")
        else:
             print("Finished scrolling.")

        # --- Data Extraction and Progressive Saving via handling.py ---
        print("Waiting briefly before extracting and saving data...")
        time.sleep(2)

        print("Extracting product data and saving to DB via create_product_link...")
        product_card_selector = "[data-qa='product-tile']"
        link_selector_within_card = "a[data-qa='product-tile--name']"

        product_cards = driver.find_elements(By.CSS_SELECTOR, product_card_selector)
        total_found = len(product_cards)
        print(f"Found {total_found} potential product cards. Processing...")

        for i, card in enumerate(product_cards):
            processed_count += 1
            print(f"Processing card {processed_count}/{total_found}...", end='\r') # Progress indicator
            product_name = "N/A"
            absolute_link = "N/A"
            try:
                link_element = card.find_element(By.CSS_SELECTOR, link_selector_within_card)
                product_name = link_element.text.strip()
                relative_link = link_element.get_attribute('href')

                # Construct absolute link
                if relative_link and relative_link.startswith('/'):
                    absolute_link = BASE_URL + relative_link
                elif relative_link and relative_link.startswith('http'):
                    absolute_link = relative_link
                else:
                    absolute_link = "Invalid Link Format"

                # Call your handling function to add to DB
                if product_name and absolute_link != "N/A" and absolute_link != "Invalid Link Format":
                    # create_product_link returns the object on success, None on failure
                    result = create_product_link(db, product_name, absolute_link)
                    if result is not None:
                         added_count += 1
                    # else: Error/duplicate occurred (logged in handling.py)

            except NoSuchElementException:
                pass # Silently skip cards that don't match
            except Exception as e:
                print(f"\n  -> Error processing card {processed_count}: {e}. Skipping card.")

        print(f"\nFinished processing {processed_count} cards.")

    except WebDriverException as e:
        print(f"\nA WebDriver error occurred: {e}", file=sys.stderr)
        print("Please check system PATH and ChromeDriver version/permissions.", file=sys.stderr)
    except Exception as e:
        print(f"\nAn unexpected error occurred during scraping: {e}", file=sys.stderr)

    finally:
        if driver:
            print("Closing WebDriver...")
            driver.quit()
            print("WebDriver closed.")

    # Return counts
    return processed_count, added_count

# --- Main Execution ---
if __name__ == "__main__":
    start_time = time.time()
    # Current time is Monday, April 7, 2025 at 6:07:36 AM CEST.
    print(f"Starting Alcampo Scraper & DB Insert at {time.strftime('%Y-%m-%d %H:%M:%S %Z')}...")
    print(f"Using Database defined in .env: {str(engine.url).split('@')[-1].split('/')[1]}") # Show DB name

    # Create database tables if they don't exist using Base from models
    try:
        print("Ensuring database table exists ('{Product_Link.__tablename__}')...")
        Base.metadata.create_all(bind=engine) # Use imported Base and engine
        print("Table check complete.")
    except Exception as e:
        print(f"FATAL: Could not create/check database tables. Error: {e}", file=sys.stderr)
        print("Ensure DB connection details in .env are correct and DB is running.", file=sys.stderr)
        sys.exit(1)

    # Use a context manager for the session from SessionLocal
    processed = 0
    added = 0
    try:
        # SessionLocal is imported from Database.connection
        with SessionLocal() as db_session:
            print("Database session started.")
            # Pass the session to the scraping function
            processed, added = scrape_alcampo_and_save_links(TARGET_URL, db_session)
    except Exception as e:
         print(f"An error occurred managing the DB session or running the scraper: {e}", file=sys.stderr)
    finally:
         print("Database session closed.") # Automatically handled by 'with'


    end_time = time.time()
    duration = end_time - start_time
    print("\n--- Scraping and Saving Complete ---")
    print(f"Total potential products processed: {processed}")
    print(f"Products successfully added to DB: {added}") # Note: This count excludes duplicates/errors from create_product_link
    print(f"Duration: {duration:.2f} seconds")
    print(f"Finished at: {time.strftime('%Y-%m-%d %H:%M:%S %Z')}")