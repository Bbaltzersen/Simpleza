from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    preference_key = Column(TEXT, nullable=False, primary_key=True)
    preference_value = Column(TEXT, nullable=False)
