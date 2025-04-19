# models/product.py

import uuid
from sqlalchemy import Column, Numeric, Integer, TEXT, VARCHAR, DateTime # Keep DateTime
# from sqlalchemy.sql import func # Needed if using server_default=func.now()
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
# import datetime

class Product(Base):
    __tablename__ = "products"

    # --- Core Identifiers ---
    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="Unique internal identifier for the product")
    retail_id = Column(VARCHAR(50), unique=True, index=True, nullable=False, comment="Retailer's unique product code")
    src_product_id = Column(UUID(as_uuid=True), nullable=True, comment="Optional link to a master product definition")

    # --- Descriptive Information ---
    english_name = Column(TEXT, nullable=True, comment="Product name (English)")
    spanish_name = Column(TEXT, nullable=False, comment="Product name (Spanish, as listed by retailer)")

    # --- Quantity and Item Size Information ---
    # Number of items included in this product listing.
    # Defaults to 1 for single items. Examples: 12 for a 12-pack, 4 for a 4-pack, 1 for a 500g bag.
    quantity = Column(Integer, nullable=False, default=1, comment="Number of items in the product/pack (e.g., 1, 4, 12)")

    # Numerical size value of *each individual item* in the product/pack.
    # Examples: 500 for a 500g bag, 1 for a 1L bottle, 120 for a 120g yogurt, 1 for items measured simply as 'unit'.
    item_size_value = Column(Numeric(10, 3), nullable=False, comment="Numerical size of one item (e.g., 500, 1, 120)")

    # Unit of measurement for item_size_value.
    # Examples: 'g', 'kg', 'ml', 'cl', 'l', 'unit'.
    item_measurement = Column(VARCHAR(10), nullable=False, comment="Unit for item_size_value (g, kg, ml, cl, l, unit)")

    # --- Variable Weight Information (Separate Concept) ---
    # For products sold by variable weight (e.g., fresh produce/meat where quantity=1, item_measurement='g'/'kg', but size varies)
    min_weight_g = Column(Integer, nullable=True, comment="Minimum estimated weight in grams (for variable weight items)")
    max_weight_g = Column(Integer, nullable=True, comment="Maximum estimated weight in grams (for variable weight items)")

    # --- Optional Timestamps ---
    # created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        # Updated representation method
        if self.quantity > 1:
             size_repr = f"{self.quantity} x {self.item_size_value} {self.item_measurement}"
        else:
             size_repr = f"{self.item_size_value} {self.item_measurement}"
        return f"<Product(retail_id='{self.retail_id}', name='{self.spanish_name}', size='{size_repr}')>"