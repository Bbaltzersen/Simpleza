# main.py

import time
import sys
import os
import datetime
import argparse
import uuid # Needed for type hint
from multiprocessing import Pool, freeze_support
from decimal import Decimal # Needed for type hint

# --- Database Imports ---
from sqlalchemy.orm import Session # Needed for type hints
from sqlalchemy.exc import SQLAlchemyError, IntegrityError # Needed for get_or_create_company
from database.connection import SessionLocal, engine
from models.base import Base
from models.alcampo_product_link import Alcampo_Product_Link
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany

# --- Worker/Task Function Imports ---
from components.scraping.scr_alcampo_product_links import worker_scrape_url as link_worker_func
from components.scraping.scr_alcampo_product_details import worker_scrape_details # Import the actual worker function

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
]

# Number of parallel processes for each task
NUM_LINK_PROCESSES = 4
NUM_DETAIL_PROCESSES = 4 # Adjust as needed based on system resources
TARGET_COMPANY_NAME = "Alcampo" # Company name for detail scraping

# --- Helper Function (Moved here from detail scraper) ---
def get_or_create_company(db: Session, company_name: str) -> Company | None:
    """
    Retrieves a company by name from the database or creates it if it doesn't exist.
    Uses the provided DB session.
    Returns the Company object or None if an error occurs.
    """
    company = db.query(Company).filter(Company.name == company_name).first()
    if company:
        return company
    else:
        print(f"   DB_INFO: Company '{company_name}' not found. Creating new entry.")
        try:
            new_company = Company(name=company_name)
            db.add(new_company)
            db.commit()
            db.refresh(new_company)
            print(f"   DB_ADD: Created company '{company_name}' with ID: {new_company.company_id}")
            return new_company
        except IntegrityError:
            db.rollback()
            print(f"   DB_WARN: IntegrityError creating company '{company_name}'. Likely race condition. Refetching.")
            company = db.query(Company).filter(Company.name == company_name).first()
            return company
        except SQLAlchemyError as e:
            db.rollback(); print(f"   DB_ERROR: SQLAlchemyError creating company '{company_name}': {e}", file=sys.stderr); return None
        except Exception as e:
            db.rollback(); print(f"   DB_ERROR: Unexpected error creating company '{company_name}': {e}", file=sys.stderr); return None

# --- Link Scraper Orchestration ---
def run_link_scraper():
    main_start_time = time.time()
    print(f"--- Starting Alcampo Parallel Link Scraper ({NUM_LINK_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")

    try:
        print(f"Target Engine: {engine.url.render_as_string(hide_password=True)}")
        print(f"Ensuring all known tables exist...")
        Base.metadata.create_all(bind=engine)
        print("Table check/creation complete.")
    except Exception as e:
        print(f"FATAL: Could not connect or setup database tables. Error: {e}", file=sys.stderr); sys.exit(1)

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
        print("WARNING: Proceeding, but duplicates already in DB won't be skipped accurately by workers.")
    finally:
        if db_session_for_preload: db_session_for_preload.close()

    tasks = [(url, links_in_db_at_start, i) for i, url in enumerate(URL_LIST)]

    print(f"\nStarting parallel link scraping for {len(URL_LIST)} URLs using {NUM_LINK_PROCESSES} processes...")
    results = []
    try:
        with Pool(processes=NUM_LINK_PROCESSES) as pool:
            results = pool.starmap(link_worker_func, tasks)
        print("\nAll link scraping worker processes finished.")
    except Exception as e:
        print(f"\n--- ERROR: An error occurred during link scraping pool execution ---", file=sys.stderr)
        print(f"     Error: {e}", file=sys.stderr)

    total_added_to_db = 0; total_unique_found_aggregate = 0
    successful_urls = 0; failed_urls = []
    for result in results:
        url_res, added_count_res, unique_count_res = result
        if added_count_res >= 0 and unique_count_res >= 0:
            total_added_to_db += added_count_res
            total_unique_found_aggregate += unique_count_res
            successful_urls += 1
        else: failed_urls.append(url_res)

    main_end_time = time.time(); main_duration = main_end_time - main_start_time
    print("\n" + "="*60)
    print("--- Link Scraper Main Process Complete ---")
    print(f"Total URLs attempted: {len(URL_LIST)}")
    print(f"URLs processed successfully: {successful_urls}")
    print(f"URLs failed: {len(failed_urls)}")
    if failed_urls: print(f"  Failed URLs: {failed_urls}")
    print(f"Total NEW links added to Database across all URLs: {total_added_to_db}")
    print(f"Total Duration: {main_duration:.2f} seconds ({main_duration/60:.2f} minutes)")
    print(f"Finished at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print("="*60)

# --- Detail Scraper Orchestration ---
def run_parallel_detail_scraper():
    main_start_time = time.time()
    print(f"--- Starting Alcampo Parallel Detail Scraper ({NUM_DETAIL_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")

    db_session = None
    company_id = None
    links_to_process = []

    try:
        print(f"Target Engine: {engine.url.render_as_string(hide_password=True)}")
        print(f"Ensuring all known tables exist...")
        Base.metadata.create_all(bind=engine)
        print("Table check/creation complete.")

        db_session = SessionLocal()

        # Get Company ID
        print(f"Checking for '{TARGET_COMPANY_NAME}' company entry...")
        target_company = get_or_create_company(db_session, TARGET_COMPANY_NAME)
        if not target_company:
            print(f"FATAL: Could not get or create '{TARGET_COMPANY_NAME}' company entry. Exiting.", file=sys.stderr)
            sys.exit(1)
        company_id = target_company.company_id
        print(f"Using Company ID for {TARGET_COMPANY_NAME}: {company_id}")

        # Fetch Links to Process
        print("Fetching unprocessed product links from database...")
        links_to_process = db_session.query(
            Alcampo_Product_Link.product_link_id,
            Alcampo_Product_Link.product_link
        ).filter(Alcampo_Product_Link.details_scraped_at == None).all()
        # ).filter(Alcampo_Product_Link.details_scraped_at == None).limit(50).all() # Optional: Limit for testing

        if not links_to_process:
            print("No unprocessed product links found to scrape details for.")
            return

        print(f"Found {len(links_to_process)} links to process.")

    except Exception as e:
        print(f"FATAL: Error during database setup or link fetching for detail scraper: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if db_session: db_session.close()


    # Prepare tasks for worker processes
    # Task: (link_url, link_id, company_id, worker_id)
    tasks = [
        (link_url, link_id, company_id, i)
        for i, (link_id, link_url) in enumerate(links_to_process)
    ]

    # Run tasks in parallel using multiprocessing Pool
    print(f"\nStarting parallel detail scraping for {len(tasks)} links using {NUM_DETAIL_PROCESSES} processes...")
    results = []
    try:
        with Pool(processes=NUM_DETAIL_PROCESSES) as pool:
            # worker_scrape_details is imported directly now
            results = pool.starmap(worker_scrape_details, tasks)
        print("\nAll detail scraping worker processes finished.")
    except Exception as e:
        print(f"\n--- ERROR: An error occurred during detail scraping pool execution ---", file=sys.stderr)
        print(f"     Error: {e}", file=sys.stderr)

    # Aggregate Results
    successful_links = 0
    failed_link_ids = []
    for result in results:
        link_id_res, success_res = result
        if success_res:
            successful_links += 1
        else:
            failed_link_ids.append(link_id_res)

    # Final Reporting
    main_end_time = time.time()
    main_duration = main_end_time - main_start_time
    print("\n" + "="*60)
    print("--- Detail Scraper Main Process Complete ---")
    print(f"Total Links attempted: {len(tasks)}")
    print(f"Links processed successfully (details saved/updated & marked): {successful_links}")
    print(f"Links failed: {len(failed_link_ids)}")
    # if failed_link_ids: print(f"  Failed Link IDs: {failed_link_ids}") # Can be very long
    print(f"Total Duration: {main_duration:.2f} seconds ({main_duration/60:.2f} minutes)")
    print(f"Finished at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print("="*60)


# --- Main Execution Guard ---
if __name__ == "__main__":
    freeze_support()

    parser = argparse.ArgumentParser(description="Run Alcampo scraping tasks.")
    parser.add_argument(
        '--task', type=str, choices=['links', 'details'], required=True,
        help='Specify task: "links" or "details".'
    )
    # Optional: Add argument for number of detail processes
    parser.add_argument(
        '--detail-workers', type=int, default=NUM_DETAIL_PROCESSES,
        help=f'Number of parallel workers for detail scraping (default: {NUM_DETAIL_PROCESSES}).'
    )
    args = parser.parse_args()

    # Update NUM_DETAIL_PROCESSES if provided via command line
    NUM_DETAIL_PROCESSES = args.detail_workers

    print(f"Executing task: {args.task}")
    overall_start = time.time()

    if args.task == 'links':
        run_link_scraper()
    elif args.task == 'details':
        run_parallel_detail_scraper() # Call the new parallel orchestrator
    else:
        print(f"Error: Unknown task '{args.task}'. Please use 'links' or 'details'.", file=sys.stderr)
        sys.exit(1)

    overall_end = time.time()
    print(f"\n--- Task '{args.task}' finished ---")
    print(f"Overall execution time for task '{args.task}': {(overall_end - overall_start):.2f} seconds")