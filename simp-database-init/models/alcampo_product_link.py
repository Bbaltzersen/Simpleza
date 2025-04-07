import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text
    )
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Product_Link(Base):
    """
    SQLAlchemy ORM model representing a product scraped from Alcampo online store.
    Maps to the 'alcampo_products' table in the database.
    """
    __tablename__ = 'alcampo_products'

    id = Column(Integer, primary_key=True)
    product_name = Column(String(500), nullable=False)
    product_link = Column(Text, nullable=False, unique=True)
    
    def __repr__(self):
        """
        Provides a developer-friendly string representation of the AlcampoProduct object,
        useful for debugging. Shows truncated name and link.
        """
        name_snippet = (self.product_name[:30] + '...') if self.product_name and len(self.product_name) > 30 else self.product_name
        link_snippet = (self.product_link[:50] + '...') if self.product_link and len(self.product_link) > 50 else self.product_link
        return f"<AlcampoProduct(id={self.id}, name='{name_snippet}', link='{link_snippet}')>"