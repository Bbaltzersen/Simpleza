import datetime
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text
    )
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
from .base import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Alcampo_Product_Link(Base):
    """
    SQLAlchemy ORM model representing a product scraped from Alcampo online store.
    Maps to the 'alcampo_products' table in the database.
    """
    __tablename__ = 'alcampo_product_links'

    product_link_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_name = Column(String(500), nullable=False)
    product_link = Column(Text, nullable=False, unique=True)
    details_scraped_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    def __repr__(self):
        """
        Provides a developer-friendly string representation of the AlcampoProduct object,
        useful for debugging. Shows truncated name and link.
        """
        name_snippet = (self.product_name[:30] + '...') if self.product_name and len(self.product_name) > 30 else self.product_name
        link_snippet = (self.product_link[:50] + '...') if self.product_link and len(self.product_link) > 50 else self.product_link
        return f"<AlcampoProduct(id={self.id}, name='{name_snippet}', link='{link_snippet}')>"