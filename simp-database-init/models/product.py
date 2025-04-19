# models/product.py

import uuid
from sqlalchemy import Column, Numeric, Integer, TEXT, VARCHAR, DateTime
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
import datetime

class Product(Base):
    __tablename__ = "products"

    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Changed retail_id to VARCHAR(50)
    retail_id = Column(VARCHAR(50), unique=True, index=True, nullable=False)
    src_product_id = Column(UUID(as_uuid=True), nullable=True)
    # Made nullable=True
    english_name = Column(TEXT, nullable=True)
    spanish_name = Column(TEXT, nullable=False)
    # Amount: 1 for weight/volume items, pack count for units
    amount = Column(Numeric(10, 2), nullable=False, default=1)
    # Weight: Quantity if measurement is g/kg/ml/cl/l, 0 default otherwise. Made nullable=True previously.
    weight = Column(Numeric(10, 2), nullable=True) # Keep nullable=True for flexibility
    # Measurement: g, kg, ml, cl, l, unit
    measurement = Column(VARCHAR(10), nullable=False)

    # --- NEW COLUMNS for Weight Range ---
    min_weight_g = Column(Integer, nullable=True)
    max_weight_g = Column(Integer, nullable=True)
    # --- END NEW COLUMNS ---

    # Optional: Add timestamps
    # created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    # updated_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)