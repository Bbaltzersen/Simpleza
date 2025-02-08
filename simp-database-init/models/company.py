import uuid
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False)
