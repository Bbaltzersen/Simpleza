from sqlalchemy import Column, Integer, TIMESTAMP, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship
from .base import Base

class CauldronData(Base):
    __tablename__ = 'cauldron_data'
    
    cauldron_data_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cauldron_id = Column(UUID(as_uuid=True), ForeignKey("cauldron.cauldron_id", ondelete="CASCADE"), nullable=False, unique=True)
    usage_count = Column(Integer, default=0)
    last_used = Column(TIMESTAMP(timezone=True))
    overall_rating = Column(Numeric(3, 2))
    taste_rating = Column(Numeric(3, 2))
    ease_rating = Column(Numeric(3, 2))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship: links back to the Cauldron entry.
    cauldron = relationship("Cauldron", back_populates="cauldron_data")
