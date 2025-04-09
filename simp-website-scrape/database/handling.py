import os
import sys
import uuid
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.alcampo_product_link import Product_Link

load_dotenv()

# --- Database Handling Function ---
# --- Database Handling Function ---
def create_product_link(db: Session, name: str, link: str) -> Product_Link | None:
    """Adds a new product link to the database, letting the DB generate the ID."""
    # DO NOT generate ID here: product_link_id = str(uuid.uuid4()) # Ensure this is commented out or removed
    try:
        # Ensure product_link_id is NOT passed here VVVVVVV
        product_link = Product_Link(
            product_name=name,
            product_link=link
            # Add other fields like created_at if needed
        )
        # ^^^^^^^ Ensure product_link_id=... is GONE from the line above

        db.add(product_link)
        db.commit()
        db.refresh(product_link)
        # Log the ID that the database generated
        print(f"  DB_ADD: Successfully committed (ID: {product_link.product_link_id}): {link}")
        return product_link
    except Exception as e:
        db.rollback()
        print(f"  DB_ERROR: Failed to add '{name}' ({link}). Error: {e}", file=sys.stderr)
        return None