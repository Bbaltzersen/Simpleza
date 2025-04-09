import os
import sys
import uuid
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.alcampo_product_link import Alcampo_Product_Link

load_dotenv()

# --- Database Handling Function ---
# --- Database Handling Function ---
def create_product_link(db: Session, name: str, link: str) -> Alcampo_Product_Link | None:
    """
    Adds a new product link to the database if it doesn't already exist.
    Checks for duplicates based on the 'link' before inserting.
    Lets the DB generate the ID (assuming Integer PK or UUID with default).

    Args:
        db: The SQLAlchemy Session object.
        name: The product name string.
        link: The product link string (URL).

    Returns:
        The newly created Product_Link object if added successfully,
        None if the link already existed or if an error occurred.
    """
    try:
        # --- Step 1: Check if the link already exists ---
        existing_link = db.query(Alcampo_Product_Link).filter(Alcampo_Product_Link.product_link == link).first()

        if existing_link:
            # If found, print info (optional) and return None to indicate no new insert
            # print(f"  DB_INFO: Link already exists: {link}") # Can be quite verbose, uncomment if needed
            return None

        # --- Step 2: If it doesn't exist, create and insert ---
        # print(f"  DB_ATTEMPT: Adding new link: {link}") # Optional debug log

        # Ensure product_link_id is NOT passed if it's auto-generated (Integer or UUID w/ default)
        product_link = Alcampo_Product_Link(
            product_name=name,
            product_link=link
        )
        db.add(product_link)
        db.commit()
        db.refresh(product_link) # Load the generated ID and other defaults

        print(f"  DB_ADD: Successfully committed (ID: {product_link.product_link_id}): {link}")
        return product_link # Return the newly created object

    except Exception as e:
        # Catch any other unexpected errors
        db.rollback() # Attempt rollback
        print(f"  DB_ERROR: Unexpected error during add/check for '{name}' ({link}). Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc() # Print detailed traceback for unexpected errors
        return None