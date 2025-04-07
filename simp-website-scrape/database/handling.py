import os
import uuid
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.alcampo_product_link import Product_Link

load_dotenv()

def create_product_link(db: Session, name: str, link: str) -> Product_Link:
    product_link = Product_Link(
        product_link_id=str(uuid.uuid4()),
        product_name=name,
        product_link=link
    )
    db.add(product_link)
    db.commit()
    db.refresh(product_link)
    return product_link