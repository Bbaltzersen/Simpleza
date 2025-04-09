# main.py

import time
import sys
import os
import datetime
from multiprocessing import Pool # Import Pool
import multiprocessing # Import the module itself if needed later (e.g., freeze_support)

# --- Database Imports ---
from database.connection import SessionLocal, engine
from models.alcampo_product_link import Base, Alcampo_Product_Link # Import Base and the specific model

# --- Worker Function Import ---
# Import the worker function that handles setup/teardown internally
from components.scraping.scr_alcampo_product_links import worker_scrape_url

# --- Configuration ---
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


# Set the fixed number of parallel processes
NUM_PROCESSES = 4

def run_parallel_scraper():
    """
    Main function to orchestrate parallel Alcampo scraping using multiprocessing.
    """
    main_start_time = time.time()
    # Note: Script uses system time. Current time provided: Wed, 09 Apr 2025 23:59:28 CEST (Spain)
    print(f"--- Starting Alcampo Parallel Scraper ({NUM_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")

    # --- Database Setup ---
    try:
        print(f"Target Engine: {engine.url.render_as_string(hide_password=True)}")
        print(f"Ensuring table(s) exist...")
        Base.metadata.create_all(bind=engine) # Create tables if they don't exist
        print("Table check/creation complete.")
    except Exception as e:
        print(f"FATAL: Could not connect or setup database tables. Error: {e}", file=sys.stderr)
        sys.exit(1)

    # --- Pre-load existing links ---
    links_in_db_at_start = set()
    db_session_for_preload = None
    try:
        print("Connecting to database for pre-loading existing links...")
        db_session_for_preload = SessionLocal()
        existing_links_query = db_session_for_preload.query(Alcampo_Product_Link.product_link).all()
        links_in_db_at_start = {link for (link,) in existing_links_query}
        print(f"Pre-loaded {len(links_in_db_at_start)} existing links from DB.")
    except Exception as e:
        print(f"ERROR: Could not pre-load links from DB: {e}", file=sys.stderr)
        print("WARNING: Proceeding, but duplicates already in DB won't be skipped accurately.")
    finally:
        if db_session_for_preload:
            db_session_for_preload.close()

    # --- Prepare tasks for worker processes ---
    # Each task needs the url, the preloaded links set, and a unique worker id
    tasks = [(url, links_in_db_at_start, i) for i, url in enumerate(URL_LIST)]

    # --- Run tasks in parallel using multiprocessing Pool ---
    print(f"\nStarting parallel scraping for {len(URL_LIST)} URLs using {NUM_PROCESSES} processes...")
    results = []
    try:
        # Create the pool of worker processes
        with Pool(processes=NUM_PROCESSES) as pool:
            # Use starmap to pass multiple arguments from the tasks list to the worker function
            results = pool.starmap(worker_scrape_url, tasks)
        print("\nAll worker processes finished.")
    except Exception as e:
        print(f"\n--- ERROR: An error occurred during parallel execution management ---", file=sys.stderr)
        print(f"    Error: {e}", file=sys.stderr)

    # --- Aggregate Results ---
    total_added_to_db = 0
    total_unique_found_aggregate = 0 # Sum of unique items found per URL scan
    successful_urls = 0
    failed_urls = []

    for result in results:
        # Worker returns -> (url, newly_added_count, unique_found_count)
        url_res, added_count_res, unique_count_res = result
        # Check if counts are valid (e.g., not negative if using error codes)
        if added_count_res >= 0 and unique_count_res >= 0:
             total_added_to_db += added_count_res
             total_unique_found_aggregate += unique_count_res
             successful_urls += 1
        else:
             failed_urls.append(url_res)


    # --- Final Reporting ---
    main_end_time = time.time()
    main_duration = main_end_time - main_start_time
    print("\n" + "="*60)
    print("--- Scraper Main Process Complete ---")
    print(f"Total URLs attempted: {len(URL_LIST)}")
    print(f"URLs processed successfully: {successful_urls}")
    print(f"URLs failed: {len(failed_urls)}")
    if failed_urls:
         print(f"  Failed URLs: {failed_urls}")
    print(f"Total NEW links added to Database across all URLs: {total_added_to_db}")
    # print(f"Sum of unique links found per URL scan: {total_unique_found_aggregate}") # Can be misleading
    print(f"Total Duration: {main_duration:.2f} seconds ({main_duration/60:.2f} minutes)")
    print(f"Finished at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print("="*60)

# --- Main Execution Guard ---
if __name__ == "__main__":
    # Important for multiprocessing on some OS (like Windows)
    # Include it just in case
    multiprocessing.freeze_support()
    run_parallel_scraper()