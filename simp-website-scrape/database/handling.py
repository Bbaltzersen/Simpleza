import os
import uuid
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.alcampo_product_link import Product_Link

load_dotenv()

def create_product_link(db: Session, name: str, link: str) -> Product_Link:
    product_link_id = str(uuid.uuid4()) 
    try:
        product_link = Product_Link(
            product_link_id=product_link_id,
            product_name=name,
            product_link=link
        )
        db.add(product_link)
        db.commit()
        db.refresh(product_link)
        print(f"INFO: Successfully committed Product Link ID: {product_link.product_link_id}")
        return product_link
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to add product link '{name}'. Error: {e}")
        return None 