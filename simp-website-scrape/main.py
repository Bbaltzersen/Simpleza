# main.py

from __future__ import annotations
import time
import sys
import os
import datetime
import argparse
import uuid
import re
from multiprocessing import Pool, freeze_support
from typing import Optional, Tuple, Dict, Any
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from database.connection import SessionLocal, engine
from models.base import Base
from models.alcampo_product_link import Alcampo_Product_Link
from models.product import Product
from models.company import Company
from models.product_company import ProductCompany

from components.scraping.scr_alcampo_product_links import worker_scrape_url as link_worker_func
from components.scraping.scr_products_from_links_alcampo import worker_scrape_details

# --- Configuration ---
URL_LIST = [
    # ... your list of category URLs ...
]
NUM_LINK_PROCESSES   = 4
NUM_DETAIL_PROCESSES = 2
TARGET_COMPANY_NAME  = "Alcampo"


# --- Helper DB functions (as in your original) ---
def get_or_create_company(db: Session, company_name: str) -> Optional[Company]:
    company = db.query(Company).filter(Company.name == company_name).first()
    if company:
        return company

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
        db.rollback()
        print(f"   DB_ERROR: Error creating company '{company_name}': {e}", file=sys.stderr)
        return None


# --- Link Scraper Orchestration ---
def run_link_scraper():
    start = time.time()
    print(f"--- Starting Alcampo Link Scraper ({NUM_LINK_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now():%Y-%m-%d %H:%M:%S %Z}")

    # ensure tables
    Base.metadata.create_all(bind=engine)

    # preload existing
    db0 = SessionLocal()
    existing = {row for (row,) in db0.query(Alcampo_Product_Link.product_link).all()}
    db0.close()
    print(f"Preloaded {len(existing)} existing links.")

    tasks = [(url, existing, i) for i, url in enumerate(URL_LIST)]
    results = []
    try:
        with Pool(NUM_LINK_PROCESSES) as p:
            results = p.starmap(link_worker_func, tasks)
    except Exception as e:
        print(f"--- ERROR: Link pool error: {e} ---", file=sys.stderr)

    # tally link results...
    added = sum(r[1] for r in results if isinstance(r, tuple))
    succeeded = sum(1 for r in results if isinstance(r, tuple) and r[1] >= 0)
    failed = [r[0] for r in results if not (isinstance(r, tuple) and r[1] >= 0)]

    print(f"Links attempted: {len(URL_LIST)}, succeeded: {succeeded}, failed: {len(failed)}, total new links: {added}")
    print(f"Duration: {time.time()-start:.2f}s")


# --- NEW Detail Scraper Orchestration (worker-side DB) ---
def run_new_detail_scraper():
    start = time.time()
    print(f"--- Starting Alcampo Detail Scraper ({NUM_DETAIL_PROCESSES} processes) ---")
    print(f"Start Time: {datetime.datetime.now():%Y-%m-%d %H:%M:%S %Z}")

    Base.metadata.create_all(bind=engine)

    # get company
    db0 = SessionLocal()
    company = get_or_create_company(db0, TARGET_COMPANY_NAME)
    if not company:
        print("FATAL: Could not get/create company.", file=sys.stderr)
        sys.exit(1)
    company_id = company.company_id

    # fetch unprocessed links
    raw = db0.query(
        Alcampo_Product_Link.product_link_id,
        Alcampo_Product_Link.product_link
    ).filter(Alcampo_Product_Link.details_scraped_at.is_(None)).all()
    db0.close()

    if not raw:
        print("No unprocessed product links found.")
        return

    print(f"Found {len(raw)} links to process.")
    # build a lookup map for reporting
    url_map = {lid: url for lid, url in raw}

    # build tasks: each is (link_url, link_id, company_id, worker_id)
    tasks = []
    for i, (link_id, link_url) in enumerate(raw):
        worker_id = i % NUM_DETAIL_PROCESSES
        tasks.append((link_url, link_id, company_id, worker_id))

    # parallel scrape+DB
    results: list[Tuple[uuid.UUID, bool]] = []
    try:
        with Pool(NUM_DETAIL_PROCESSES) as p:
            results = p.starmap(worker_scrape_details, tasks)
    except Exception as e:
        print(f"\n--- ERROR: Detail pool error: {e} ---", file=sys.stderr)

    # tally
    successes = [lid for lid, ok in results if ok]
    failures  = [lid for lid, ok in results if not ok]

    print("\n" + "="*60)
    print("--- Detail Scraper Complete ---")
    print(f"Total attempted: {len(tasks)}")
    print(f"Successful: {len(successes)}")
    print(f"Failed: {len(failures)}")
    if failures:
        print("Failed link URLs:")
        for lid in failures:
            print(f"  - {lid} → {url_map.get(lid)}")
    print(f"Total Duration: {time.time()-start:.2f}s ({(time.time()-start)/60:.2f}m)")
    print(f"Finished at: {datetime.datetime.now():%Y-%m-%d %H:%M:%S %Z}")
    print("="*60)


# --- Main Execution ---
if __name__ == "__main__":
    freeze_support()
    parser = argparse.ArgumentParser("Alcampo scraper")
    parser.add_argument('--task', choices=['links','details'], required=True)
    parser.add_argument('--link-workers', type=int,   default=NUM_LINK_PROCESSES)
    parser.add_argument('--detail-workers', type=int, default=NUM_DETAIL_PROCESSES)
    args = parser.parse_args()

    NUM_LINK_PROCESSES   = args.link_workers
    NUM_DETAIL_PROCESSES = args.detail_workers
    print(f"Task: {args.task}; link workers={NUM_LINK_PROCESSES}; detail workers={NUM_DETAIL_PROCESSES}")

    if args.task == 'links':
        run_link_scraper()
    else:
        run_new_detail_scraper()
    print(f"\n--- All done ({args.task}) in {time.time():.2f}s ---")
