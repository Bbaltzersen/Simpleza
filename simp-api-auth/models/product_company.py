from sqlalchemy import Column, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class ProductCompany(Base):
    __tablename__ = "product_companies"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"), primary_key=True)
    price = Column(Numeric(10, 2), nullable=False)
