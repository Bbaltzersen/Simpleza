# main.py

import time
import sys
import os # Good practice to import os if dealing with paths/env implicitly

# Database Imports (from your modules)
# Assuming Database/connection.py provides SessionLocal and engine
from database.connection import SessionLocal, engine
# Assuming models/alcampo_product_link.py defines Base
# Corrected import path assuming models is at the root level
from models.alcampo_product_link import Base

# Scraping Component Import
# Corrected import path based on assumed structure
from components.scraping.scr_alcampo_product_links import scrape_alcampo_and_save_links

# --- Configuration ---
# Define the target URL here or load from a config source
ALCAMPO_FRESH_URL = "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation"

def run_scraper():
    """
    Main function to orchestrate the Alcampo scraping process.
    Handles database setup, session management, and calls the scraper component.
    """
    start_time = time.time()
    # Use time.strftime for current time based on system locale
    # Current time is Monday, April 7, 2025 at 6:16:45 AM CEST.
    print(f"Starting Alcampo Scraper at {time.strftime('%Y-%m-%d %H:%M:%S %Z')}...")

    # Display target database (mask credentials if needed, engine.url is usually safe)
    try:
        # Extract db name assuming standard URL format
        db_name = str(engine.url).split('/')[-1]
        db_host = str(engine.url).split('@')[-1].split('/')[0]
        print(f"Target Database: {db_name} on {db_host}")
    except Exception as e:
         print(f"WARNING: Could not display full database info. Using Engine URL. Error: {e}")
         print(f"Target Engine: {engine.url.render_as_string(hide_password=True)}") # Hide password

    # Ensure database table(s) exist based on models linked to Base
    try:
        print(f"Ensuring database table(s) defined in models derived from Base exist...")
        # Use imported Base and engine
        Base.metadata.create_all(bind=engine)
        print("Table check/creation complete.")
    except Exception as e:
        print(f"FATAL: Could not create/check database tables. Error: {e}", file=sys.stderr)
        print("Please ensure DB connection details in .env are correct and the database server is running.", file=sys.stderr)
        sys.exit(1) # Critical error, exit

    # Use SQLAlchemy session context manager for reliable session handling
    processed = 0
    added = 0
    try:
        # SessionLocal is imported from Database.connection
        print("Attempting to start database session...")
        with SessionLocal() as db_session:
            print("Database session started successfully.")
            # Call the imported scraping function, passing the URL and the active session
            # Assumes scrape_alcampo_and_save_links handles its own WebDriver setup/teardown
            processed, added = scrape_alcampo_and_save_links(ALCAMPO_FRESH_URL, db_session)
            print("Scraping function finished.")
        # Session is automatically committed if no exceptions occur within 'with' block,
        # or rolled back if an exception occurs. It's also closed.
        print("Database session closed.")

    except Exception as e:
         # Catch errors during session creation or the scraping call
         print(f"\n--- An error occurred during the main scraping execution ---", file=sys.stderr)
         print(f"Error: {e}", file=sys.stderr)
         # Optional: Log detailed traceback for debugging
         # import traceback
         # traceback.print_exc()

    # --- Reporting ---
    end_time = time.time()
    duration = end_time - start_time
    print("\n--- Scraper Main Process Complete ---")
    print(f"Total potential products processed by scraper: {processed}")
    # This count reflects successful calls to create_product_link (which handles duplicates/errors internally)
    print(f"Products successfully added/updated in DB: {added}")
    print(f"Total Duration: {duration:.2f} seconds")
    print(f"Finished at: {time.strftime('%Y-%m-%d %H:%M:%S %Z')}")

# --- Main Execution Guard ---
# Ensures the run_scraper function is called only when the script is executed directly
if __name__ == "__main__":
    run_scraper()