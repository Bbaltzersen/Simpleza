import uuid
from sqlalchemy import Column, Numeric
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class Nutrition(Base):
    __tablename__ = "nutrition"

    nutrition_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, nullable=False)
    measurement = Column(TEXT, nullable=False)
    recommended = Column(Numeric(10, 2))
