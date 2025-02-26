import uuid
from sqlalchemy import Column, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, TEXT
from db.connection import engine
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"

    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    english_name = Column(TEXT, nullable=False)
    spanish_name = Column(TEXT, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=1)
    weight = Column(Numeric(10, 2), nullable=False)
    measurement = Column(TEXT, nullable=False)

class ProductCompany(Base):
    __tablename__ = "product_companies"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)
    company_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    price = Column(Numeric(10, 2), nullable=False)

Base.metadata.create_all(bind=engine)
