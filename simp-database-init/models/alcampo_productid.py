import uuid
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class AlcampoProductID(Base):
    __tablename__ = "alcampo_productids"

    alc_product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    src_product_id = Column(UUID(as_uuid=True), unique=True, nullable=False)