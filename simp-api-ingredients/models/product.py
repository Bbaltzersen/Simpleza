import uuid
from sqlalchemy import Column, Numeric
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class Product(Base):
    """Database model for storing product details."""
    __tablename__ = "products"

    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    retail_id = Column(Numeric, nullable=True)
    src_product_id = Column(UUID(as_uuid=True), nullable=True)
    english_name = Column(TEXT, nullable=False)
    spanish_name = Column(TEXT, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=1)
    weight = Column(Numeric(10, 2), nullable=False)
    measurement = Column(TEXT, nullable=False)
