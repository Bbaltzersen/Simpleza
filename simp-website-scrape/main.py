# main.py

import time
import sys
import os
import datetime # Needed for timestamp

# --- Database Imports ---
from database.connection import SessionLocal, engine
# Assuming models are linked via Base in models/alcampo_product_link.py or similar
from models.alcampo_product_link import Base, Alcampo_Product_Link # Import Base and the specific model

# --- Selenium Imports ---
from selenium import webdriver
from selenium.common.exceptions import WebDriverException

# --- Scraping Component Import ---
# Import the refactored function
from components.scraping.scr_alcampo_product_links import scrape_alcampo_incrementally

# --- Configuration ---
# Define the list of target category URLs
# TODO: Move this to a config file or environment variable for production
URL_LIST = [
    "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation",
    "https://www.compraonline.alcampo.es/categories/frescos/frutas/OC1701?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/verduras-y-hortalizas/OC1702?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/pescados-mariscos-y-moluscos/OC14?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/ahumados-surimis-anchoas-pulpos-y-otros/OC184?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/carne/OC13?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/charcuter%C3%ADa/OC15?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/jamones-y-paletas/OC151001?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/quesos/OCQuesos?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/frescos/panader%C3%ADa/OC1281?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/OC16?source=navigation",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/leche/OC1603?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/bebidas-vegetales/OC1609?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/preparado-l%C3%A1cteo/OCPreparadolacteo?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/huevos/OC1608?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/yogures-b%C3%ADfidus-y-l-casei/OC1601?sortBy=favorite",    
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/mantequilla/OC1606?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/margarinas-y-otros-untables/OC1607?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/postres-l%C3%A1cteos/OC1602?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/nata/OC1605?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/batidos-y-horchatas/OC1604?sortBy=favorite",
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/leche-condensada-polvo-y-evaporada/OC160316?sortBy=favorite",
    # Add more category URLs here as needed
]

def run_scraper():
    """
    Main function to orchestrate the Alcampo scraping process for multiple URLs.
    Handles WebDriver and database setup, session management, loops through URLs,
    and calls the scraper component for each.
    """
    main_start_time = time.time()
    # Use datetime for timezone aware timestamp if needed, otherwise time.strftime is ok
    print(f"--- Starting Alcampo Multi-URL Scraper ---")
    print(f"Start Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")

    # --- Database Setup ---
    try:
        db_name = str(engine.url).split('/')[-1]
        db_host = str(engine.url).split('@')[-1].split('/')[0]
        print(f"Target Database: {db_name} on {db_host}")
        print(f"Ensuring table(s) exist...")
        Base.metadata.create_all(bind=engine) # Create tables if they don't exist
        print("Table check/creation complete.")
    except Exception as e:
        print(f"FATAL: Could not connect or setup database tables. Error: {e}", file=sys.stderr)
        sys.exit(1)

    # --- Initialize WebDriver ---
    driver = None
    try:
        print("Initializing WebDriver...")
        # Add options if needed (headless, etc.)
        # options = webdriver.ChromeOptions()
        # options.add_argument('--headless')
        # driver = webdriver.Chrome(options=options)
        driver = webdriver.Chrome()
        driver.maximize_window()
        print("WebDriver initialized successfully.")
    except WebDriverException as e:
         print(f"FATAL: Failed to initialize WebDriver. Error: {e}", file=sys.stderr)
         print("Please ensure ChromeDriver is installed and compatible.", file=sys.stderr)
         sys.exit(1)

    # --- Initialize Totals ---
    total_added_to_db_all_urls = 0
    total_unique_found_all_urls = 0 # Can track unique across all runs if needed, but simpler per url
    processed_url_count = 0
    failed_url_count = 0

    # --- DB Session and Pre-load ---
    db_session = None
    links_in_db_at_start = set()
    try:
        print("Connecting to database and pre-loading existing links...")
        db_session = SessionLocal()
        existing_links_query = db_session.query(Alcampo_Product_Link.product_link).all()
        links_in_db_at_start = {link for (link,) in existing_links_query}
        print(f"Pre-loaded {len(links_in_db_at_start)} existing links from DB.")

        # --- Loop through URLs ---
        print(f"\nStarting scrape for {len(URL_LIST)} URLs...")
        for i, url in enumerate(URL_LIST, 1):
            print(f"\n{'-'*20} Processing URL {i}/{len(URL_LIST)} {'-'*20}")
            url_start_time = time.time()
            try:
                # Call the refactored scraper function
                added_count, unique_count = scrape_alcampo_incrementally(
                    url=url,
                    driver=driver,
                    db=db_session,
                    links_in_db_at_start=links_in_db_at_start
                )
                total_added_to_db_all_urls += added_count
                # unique_count is per-URL, accumulating might double count if products appear in multiple cats
                # Keep track of processed URLs instead
                processed_url_count += 1
                url_duration = time.time() - url_start_time
                print(f"Finished URL {i}. Added: {added_count}, Found Unique: {unique_count}. Duration: {url_duration:.2f}s")

            except Exception as e:
                # Catch errors during individual URL scrape but continue loop
                failed_url_count += 1
                print(f"\n--- ERROR: Failed to completely scrape URL {i}: {url} ---", file=sys.stderr)
                print(f"    Error: {e}", file=sys.stderr)
                # Maybe add a longer pause or refresh driver if errors are frequent?
                time.sleep(5) # Brief pause after a URL fails

    except Exception as e:
         # Catch errors during session creation or pre-load
         print(f"\n--- FATAL Error during database session or pre-load ---", file=sys.stderr)
         print(f"    Error: {e}", file=sys.stderr)
         # No point continuing if DB session failed early
         if driver: driver.quit() # Try to clean up driver
         sys.exit(1)
    finally:
        # --- Close DB Session ---
        if db_session:
            print("\nClosing database session...")
            db_session.close()
            print("Database session closed.")
        # --- Quit WebDriver ---
        if driver:
            print("Closing WebDriver...")
            driver.quit()
            print("WebDriver closed.")


    # --- Final Reporting ---
    main_end_time = time.time()
    main_duration = main_end_time - main_start_time
    print("\n--- Scraper Main Process Complete ---")
    print(f"Total URLs processed successfully: {processed_url_count}")
    print(f"Total URLs failed: {failed_url_count}")
    print(f"Total NEW links added to Database across all URLs: {total_added_to_db_all_urls}")
    print(f"Total Duration: {main_duration:.2f} seconds ({main_duration/60:.2f} minutes)")
    print(f"Finished at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")

# --- Main Execution Guard ---
if __name__ == "__main__":
    run_scraper()