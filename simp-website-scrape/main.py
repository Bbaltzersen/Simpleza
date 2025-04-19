# main.py

import time
import sys
import os
import datetime
import argparse
import uuid # Needed for type hint
import re   # Needed for extract_id_from_url and price normalization
from multiprocessing import Pool, freeze_support
from typing import Optional, Tuple, Dict, Any # Added Dict, Any
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP # Needed for helpers

# --- Database Imports ---
from sqlalchemy.orm import Session # Needed for type hints
from sqlalchemy.exc import SQLAlchemyError, IntegrityError # Needed for helpers
from database.connection import SessionLocal, engine
from models.base import Base
from models.alcampo_product_link import Alcampo_Product_Link
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany

# --- Worker/Task Function Imports ---
from components.scraping.scr_alcampo_product_links import worker_scrape_url as link_worker_func
# This orchestrator only returns data, DB logic will be handled in main
from components.scraping.scr_products_from_links_alcampo import scrape_product_details as detail_scraper_func # Corrected import

# --- Configuration ---
URL_LIST = [
    # Keep your URL list as is
    "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation",
    "https://www.compraonline.alcampo.es/categories/frescos/frutas/OC1701?sortBy=favorite",
    # ... (rest of URLs) ...
    "https://www.compraonline.alcampo.es/categories/leche-huevos-l%C3%A1cteos-yogures-y-bebidas-vegetales/leche-condensada-polvo-y-evaporada/OC160316?sortBy=favorite",
]

NUM_LINK_PROCESSES = 4
NUM_DETAIL_PROCESSES = 2 # Default detail processes for the new scraper
TARGET_COMPANY_NAME = "Alcampo"

# --- Helper Functions (Database Interactions & Parsing) ---
# Ideally, move these to a database_utils.py file

def get_or_create_company(db: Session, company_name: str) -> Optional[Company]:
    """ Retrieves or creates a Company entry. """
    # (Same logic as before)
    company = db.query(Company).filter(Company.name == company_name).first()
    if company: return company
    else:
        print(f"   DB_INFO: Company '{company_name}' not found. Creating...")
        try:
            new_company = Company(name=company_name)
            db.add(new_company); db.commit(); db.refresh(new_company)
            print(f"   DB_ADD: Created company '{company_name}' ID: {new_company.company_id}")
            return new_company
        except IntegrityError:
            db.rollback()
            print(f"   DB_WARN: IntegrityError creating company '{company_name}'. Refetching.")
            return db.query(Company).filter(Company.name == company_name).first()
        except Exception as e:
            db.rollback(); print(f"   DB_ERROR: Error creating company '{company_name}': {e}", file=sys.stderr); return None

def extract_id_from_url(url: str) -> Optional[str]:
    """ Extracts the trailing number (assumed Alcampo retail_id) from a URL. """
    if not url: return None
    match = re.search(r'/(\d+)$', url.strip())
    return match.group(1) if match else None

def save_or_get_product(db: Session, product_data: Dict[str, Any]) -> Optional[Product]:
    """ Saves a new product or retrieves an existing one based on retail_id. """
    retail_id = product_data.get('retail_id')
    if not retail_id:
        print("   DB_ERROR: retail_id missing in product_data for save_or_get_product", file=sys.stderr)
        return None

    try:
        existing_product = db.query(Product).filter(Product.retail_id == retail_id).first()
        if existing_product:
            # Optional: Update existing product fields if needed? For now, just return it.
            # print(f"   DB_INFO: Found existing product for retail_id {retail_id}")
            return existing_product
        else:
            # Ensure essential fields are present for creation
            required_fields = ['retail_id', 'spanish_name', 'quantity', 'item_size_value', 'item_measurement']
            if not all(field in product_data and product_data[field] is not None for field in required_fields):
                 missing = [f for f in required_fields if not (f in product_data and product_data[f] is not None)]
                 print(f"   DB_ERROR: Missing required fields {missing} for creating product {retail_id}", file=sys.stderr)
                 return None

            new_product = Product(
                retail_id=product_data['retail_id'],
                spanish_name=product_data['spanish_name'],
                quantity=product_data['quantity'],
                item_size_value=product_data['item_size_value'],
                item_measurement=product_data['item_measurement'],
                min_weight_g=product_data.get('min_weight_g'), # Optional
                max_weight_g=product_data.get('max_weight_g'), # Optional
                english_name=product_data.get('english_name'), # Optional
                src_product_id=product_data.get('src_product_id') # Optional
            )
            db.add(new_product)
            db.commit()
            db.refresh(new_product)
            print(f"   DB_ADD: Created product '{new_product.spanish_name}' (ID: {new_product.product_id}, RetailID: {retail_id})")
            return new_product
    except SQLAlchemyError as e:
        db.rollback()
        print(f"   DB_ERROR: SQLAlchemyError saving/getting product {retail_id}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        db.rollback()
        print(f"   DB_ERROR: Unexpected error saving/getting product {retail_id}: {e}", file=sys.stderr)
        return None

def calculate_normalized_price(
    ppu_price: Optional[Decimal], ppu_unit: Optional[str],
    # Future: Add main_price, quantity, item_size, item_unit for calculation if PPU missing
    ) -> Optional[Decimal]:
    """ Calculates the price per base unit (kg, l, unit). """
    # Currently only uses explicit PPU if available
    if ppu_price is not None and ppu_unit is not None:
        if ppu_unit in ['kg', 'l', 'unit']:
            # Price is already normalized
            return ppu_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
             print(f"   WARN: Cannot normalize price for explicit PPU unit '{ppu_unit}' yet.")
             return None # Or handle other units if needed
    # TODO: Add calculation logic if ppu_price is None, using main_price and size info
    # Requires extracting main_price in the scraper first
    # Example (needs main_price, quantity, item_size_value, item_measurement):
    # if main_price and quantity and item_size_value and item_measurement:
    #     try:
    #         total_items = Decimal(quantity)
    #         item_size = Decimal(item_size_value)
    #         price_per_item = main_price / total_items
    #
    #         if item_measurement == 'kg': return (price_per_item / item_size).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    #         if item_measurement == 'l': return (price_per_item / item_size).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    #         if item_measurement == 'g': return (price_per_item / item_size * 1000).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    #         if item_measurement == 'ml': return (price_per_item / item_size * 1000).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    #         if item_measurement == 'cl': return (price_per_item / item_size * 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    #         if item_measurement == 'unit': return price_per_item.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    #     except Exception as calc_e:
    #          print(f"   WARN: Error calculating normalized price from main price: {calc_e}")

    return None # Return None if no price could be normalized


def update_or_create_product_company_price(db: Session, product_id: uuid.UUID, company_id: uuid.UUID, norm_price: Optional[Decimal]) -> Optional[ProductCompany]:
    """ Creates or updates the price in the ProductCompany table. """
    if norm_price is None:
        # print(f"   DB_INFO: No normalized price provided for product {product_id}. Skipping ProductCompany update.")
        return None # Or decide if you want to store NULL price

    try:
        # Ensure price is correctly quantized
        quantized_price = norm_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        pc = db.query(ProductCompany).filter(
            ProductCompany.product_id == product_id,
            ProductCompany.company_id == company_id
        ).first()

        if pc:
            # Update price only if it has changed
            if pc.price != quantized_price:
                pc.price = quantized_price
                db.commit()
                db.refresh(pc)
                # print(f"   DB_UPDATE: Updated ProductCompany price for ProdID {product_id} to {quantized_price}")
            # else: # Debug
            #     print(f"   DB_INFO: ProductCompany price for ProdID {product_id} unchanged ({quantized_price}).")
            return pc
        else:
            # Create new entry
            new_pc = ProductCompany(
                product_id=product_id,
                company_id=company_id,
                price=quantized_price
            )
            db.add(new_pc)
            db.commit()
            db.refresh(new_pc)
            print(f"   DB_ADD: Created ProductCompany price for ProdID {product_id} with price {quantized_price}")
            return new_pc
    except SQLAlchemyError as e:
        db.rollback()
        print(f"   DB_ERROR: SQLAlchemyError updating/creating ProductCompany for ProdID {product_id}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        db.rollback()
        print(f"   DB_ERROR: Unexpected error in ProductCompany update for ProdID {product_id}: {e}", file=sys.stderr)
        return None

def mark_link_processed(db: Session, link_id: uuid.UUID) -> bool:
    """ Marks a link as processed in the alcampo_product_links table. """
    if not link_id: return False
    try:
        link = db.query(Alcampo_Product_Link).filter(Alcampo_Product_Link.product_link_id == link_id).first()
        if link and hasattr(link, 'details_scraped_at'):
            link.details_scraped_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            # print(f"   DB_UPDATE: Marked link ID {link_id} as processed.")
            return True
        elif not link:
             print(f"   DB_WARN: Could not find link ID {link_id} to mark as processed.", file=sys.stderr)
             return False
        else: # Should not happen if model is correct
             print(f"   DB_WARN: Link ID {link_id} found but missing 'details_scraped_at' attribute?", file=sys.stderr)
             return False
    except SQLAlchemyError as e:
        db.rollback()
        print(f"   DB_ERROR: SQLAlchemyError marking link {link_id} processed: {e}", file=sys.stderr)
        return False
    except Exception as e:
        db.rollback()
        print(f"   DB_ERROR: Unexpected error marking link {link_id} processed: {e}", file=sys.stderr)
        return False


# --- Link Scraper Orchestration (No changes needed here) ---
def run_link_scraper():
    # (Function remains the same as previous version)
    main_start_time = time.time()
    print(f"--- Starting Alcampo Parallel Link Scraper ({NUM_LINK_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    try:
        print(f"Target Engine: {engine.url.render_as_string(hide_password=True)}")
        print(f"Ensuring all known tables exist...")
        Base.metadata.create_all(bind=engine)
        print("Table check/creation complete.")
    except Exception as e: print(f"FATAL: Could not connect or setup database tables. Error: {e}", file=sys.stderr); sys.exit(1)
    links_in_db_at_start = set()
    db_session_for_preload = None
    try:
        print("Connecting to database for pre-loading existing links...")
        db_session_for_preload = SessionLocal()
        existing_links_query = db_session_for_preload.query(Alcampo_Product_Link.product_link).all()
        links_in_db_at_start = {link for (link,) in existing_links_query}
        print(f"Pre-loaded {len(links_in_db_at_start)} existing links from DB.")
    except Exception as e: print(f"ERROR: Could not pre-load links from DB: {e}", file=sys.stderr); print("WARNING: Proceeding...")
    finally:
        if db_session_for_preload: db_session_for_preload.close()
    tasks = [(url, links_in_db_at_start, i) for i, url in enumerate(URL_LIST)]
    print(f"\nStarting parallel link scraping for {len(URL_LIST)} URLs using {NUM_LINK_PROCESSES} processes...")
    results = []
    try:
        with Pool(processes=NUM_LINK_PROCESSES) as pool: results = pool.starmap(link_worker_func, tasks)
        print("\nAll link scraping worker processes finished.")
    except Exception as e: print(f"\n--- ERROR: Link scraping pool execution error: {e} ---", file=sys.stderr)
    total_added_to_db = 0; successful_urls = 0; failed_urls = []
    if results:
        for result in results:
            if isinstance(result, tuple) and len(result) == 3:
                 url_res, added_count_res, _ = result # Ignore unique count here
                 if isinstance(added_count_res, int) and added_count_res >= 0:
                     total_added_to_db += added_count_res; successful_urls += 1
                 else: failed_urls.append(url_res)
            else: print(f"WARN: Unexpected link worker result format: {result}", file=sys.stderr)
    main_end_time = time.time(); main_duration = main_end_time - main_start_time
    print("\n" + "="*60); print("--- Link Scraper Main Process Complete ---")
    print(f"URLs attempted: {len(URL_LIST)} | Succeeded: {successful_urls} | Failed: {len(failed_urls)}")
    if failed_urls: print(f"   Failed/Error URLs: {failed_urls}")
    print(f"Total NEW links added to Database: {total_added_to_db}")
    print(f"Total Duration: {main_duration:.2f}s"); print("="*60)


# --- NEW Detail Scraper Orchestration (using helpers) ---
def run_new_detail_scraper():
    main_start_time = time.time()
    print(f"--- Starting NEW Alcampo Parallel Detail Scraper ({NUM_DETAIL_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")

    db_session: Optional[Session] = None
    company_id: Optional[uuid.UUID] = None
    links_data_to_process: list[Tuple[uuid.UUID, str]] = [] # List of (link_id, link_url)

    try:
        # --- Database Setup ---
        print(f"Target Engine: {engine.url.render_as_string(hide_password=True)}")
        print(f"Ensuring all known tables exist...")
        Base.metadata.create_all(bind=engine)
        print("Table check/creation complete.")

        db_session = SessionLocal()

        # --- Get Company ID ---
        print(f"Checking for '{TARGET_COMPANY_NAME}' company entry...")
        target_company = get_or_create_company(db_session, TARGET_COMPANY_NAME)
        if not target_company:
            print(f"FATAL: Could not get or create '{TARGET_COMPANY_NAME}'. Exiting.", file=sys.stderr)
            if db_session: db_session.close(); sys.exit(1)
        company_id = target_company.company_id
        print(f"Using Company ID for {TARGET_COMPANY_NAME}: {company_id}")

        # --- Fetch Links to Process ---
        print("Fetching unprocessed product links from database...")
        links_data_to_process = db_session.query(
            Alcampo_Product_Link.product_link_id,
            Alcampo_Product_Link.product_link
        ).filter(Alcampo_Product_Link.details_scraped_at == None).all()
        # ).limit(50).all() # Optional: Limit for testing

        if not links_data_to_process:
            print("No unprocessed product links found.")
            return

        print(f"Found {len(links_data_to_process)} links to process.")

    except Exception as e:
        print(f"FATAL: Error during DB setup or link fetching: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if db_session: db_session.close() # Close session used for setup


    # --- Prepare tasks for worker pool ---
    # Pool tasks will just be (link_url, worker_id)
    # We need to store link_id separately to map results back
    tasks_for_pool = []
    link_id_map = {} # Map task index back to link_id
    for i, (link_id, link_url) in enumerate(links_data_to_process):
        worker_id = i % NUM_DETAIL_PROCESSES
        tasks_for_pool.append((link_url, worker_id))
        link_id_map[i] = link_id # Store link_id based on task index

    # --- Run scraping tasks in parallel ---
    print(f"\nStarting parallel detail scraping for {len(tasks_for_pool)} links using {NUM_DETAIL_PROCESSES} processes...")
    # Results will be a list of tuples, each containing 8 data points (or Nones)
    scraped_data_results: list[Tuple] = []
    try:
        with Pool(processes=NUM_DETAIL_PROCESSES) as pool:
            # Call the data-returning scraper function
            scraped_data_results = pool.starmap(detail_scraper_func, tasks_for_pool)
        print("\nAll detail scraping worker processes finished.")
    except Exception as e:
        print(f"\n--- ERROR: Detail scraping pool execution error: {e} ---", file=sys.stderr)
        # Note: We might have partial results in scraped_data_results even if pool fails

    # --- Process Results and Save to Database (Sequential) ---
    print(f"\nProcessing {len(scraped_data_results)} results and saving to database...")
    successful_saves = 0
    failed_saves_link_ids = []
    db_session = None # Reset session

    if not company_id: # Should not happen if setup succeeded, but check
         print("FATAL: Company ID is missing. Cannot process results.", file=sys.stderr)
         sys.exit(1)

    for i, data_tuple in enumerate(scraped_data_results):
        link_id = link_id_map.get(i)
        link_url = next((url for idx, (lid, url) in enumerate(links_data_to_process) if idx == i), "UNKNOWN_URL") # Get URL for logging

        if link_id is None:
            print(f"WARN: Could not find link_id for result index {i}. Skipping.", file=sys.stderr)
            continue

        print(f"Processing result for Link ID: {link_id} ({link_url})")

        try:
            db_session = SessionLocal() # Get a new session for each item

            # Unpack data (ensure order matches detail_scraper_func return)
            (product_title, ppu_price, ppu_unit, quantity, item_size_value,
             item_measurement, min_weight_g, max_weight_g) = data_tuple

            # Basic validation of essential scraped data
            if not all([product_title, quantity is not None, item_size_value is not None, item_measurement]):
                print(f"   DB_SKIP: Missing essential scraped data (title/qty/size/measure) for link {link_id}. Skipping save.")
                failed_saves_link_ids.append(link_id)
                if db_session: db_session.close()
                continue

            # Get retail_id from URL
            retail_id = extract_id_from_url(link_url)
            if not retail_id:
                 print(f"   DB_SKIP: Could not extract retail_id from URL {link_url} for link {link_id}. Skipping save.", file=sys.stderr)
                 failed_saves_link_ids.append(link_id)
                 if db_session: db_session.close()
                 continue

            # Prepare data for Product model
            product_data = {
                'retail_id': retail_id,
                'spanish_name': product_title,
                'quantity': quantity,
                'item_size_value': item_size_value,
                'item_measurement': item_measurement,
                'min_weight_g': min_weight_g,
                'max_weight_g': max_weight_g,
            }

            # Save/Get Product
            product_object = save_or_get_product(db_session, product_data)
            if not product_object:
                 print(f"   DB_FAIL: Failed to save/get product for link {link_id}, retail_id {retail_id}. Skipping price/mark.", file=sys.stderr)
                 failed_saves_link_ids.append(link_id)
                 if db_session: db_session.close()
                 continue

            # Calculate normalized price
            normalized_price = calculate_normalized_price(ppu_price, ppu_unit) # Add more args later if needed
            if normalized_price is None:
                 print(f"   DB_INFO: Could not determine normalized price for link {link_id}. Price not updated.")
                 # Still mark link as processed if product was saved? Or count as fail? Let's mark processed.

            # Update/Create ProductCompany price
            pc_entry = update_or_create_product_company_price(
                 db=db_session,
                 product_id=product_object.product_id,
                 company_id=company_id,
                 norm_price=normalized_price
            )
            # Log warning if price update failed but product exists
            if normalized_price is not None and not pc_entry:
                 print(f"   DB_WARN: Failed to update/create ProductCompany price for link {link_id}, product {product_object.product_id}.", file=sys.stderr)


            # Mark link as processed (even if price update failed, product was handled)
            marked_ok = mark_link_processed(db_session, link_id)
            if marked_ok:
                 successful_saves += 1
            else:
                 # This is problematic - means we might re-process later
                 print(f"   DB_FAIL: CRITICAL - Failed to mark link {link_id} as processed after handling product!", file=sys.stderr)
                 failed_saves_link_ids.append(link_id) # Count as failure if mark fails


        except Exception as e:
            print(f"   DB_FAIL: Unexpected error processing result for link {link_id}: {e}", file=sys.stderr)
            failed_saves_link_ids.append(link_id)
            # Ensure rollback happens if session exists
            if db_session:
                try: db_session.rollback()
                except: pass # Ignore rollback errors during exception handling
        finally:
            if db_session: db_session.close() # Ensure session is closed


    # --- Final Reporting for New Scraper ---
    main_end_time = time.time()
    main_duration = main_end_time - main_start_time
    print("\n" + "="*60)
    print("--- NEW Detail Scraper Main Process Complete ---")
    print(f"Total Links attempted: {len(tasks_for_pool)}")
    print(f"Links processed and saved successfully: {successful_saves}")
    # Note: failed_saves_link_ids might contain duplicates if multiple errors occurred for one link
    unique_failed_count = len(set(failed_saves_link_ids))
    print(f"Links failed during scraping or saving: {unique_failed_count}")
    # if unique_failed_count > 0: print(f"   Unique Failed Link IDs: {list(set(failed_saves_link_ids))}") # Can be long
    print(f"Total Duration: {main_duration:.2f} seconds ({main_duration/60:.2f} minutes)")
    print(f"Finished at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print("="*60)

# --- Main Execution Guard ---
if __name__ == "__main__":
    freeze_support() # Needed for multiprocessing on some platforms (e.g., Windows)

    parser = argparse.ArgumentParser(description="Run Alcampo scraping tasks.")
    parser.add_argument(
        '--task', type=str, choices=['links', 'details'], required=True, # Keep 'details' choice for now
        help='Specify task: "links" or "details".'
    )
    parser.add_argument(
        '--link-workers', type=int, default=NUM_LINK_PROCESSES,
        help=f'Number of parallel workers for link scraping (default: {NUM_LINK_PROCESSES}).'
    )
    parser.add_argument(
        '--detail-workers', type=int, default=NUM_DETAIL_PROCESSES,
        help=f'Number of parallel workers for detail scraping (default: {NUM_DETAIL_PROCESSES}).'
    )
    args = parser.parse_args()

    # Update global config vars from argparse
    NUM_LINK_PROCESSES = args.link_workers
    NUM_DETAIL_PROCESSES = args.detail_workers

    print(f"Executing task: {args.task}")
    print(f"Using {NUM_LINK_PROCESSES} worker(s) for links.")
    print(f"Using {NUM_DETAIL_PROCESSES} worker(s) for details.")
    overall_start = time.time()

    if args.task == 'links':
        run_link_scraper()
    elif args.task == 'details':
        # --- CHOOSE WHICH DETAIL SCRAPER TO RUN ---
        # Option 1: Run the old one (assumes scr_alcampo_product_details.py exists and works)
        # print("\nWARNING: Running OLD detail scraper (`detail_worker_func`) - Ensure `scr_alcampo_product_details.py` is configured correctly.")
        # run_parallel_detail_scraper()

        # Option 2: Run the new one (uses helpers and handles DB in main)
        print("\nINFO: Running NEW detail scraper (`run_new_detail_scraper`) - Uses helpers, handles DB here.")
        run_new_detail_scraper()
        # -----------------------------------------
    else:
        print(f"Error: Unknown task '{args.task}'. Please use 'links' or 'details'.", file=sys.stderr)
        sys.exit(1)

    overall_end = time.time()
    print(f"\n--- Task '{args.task}' finished ---")
    print(f"Overall execution time for task '{args.task}': {(overall_end - overall_start):.2f} seconds")