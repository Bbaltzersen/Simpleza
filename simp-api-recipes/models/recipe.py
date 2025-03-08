from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base
import uuid

class Recipe(Base):
    __tablename__ = "recipes"

    recipe_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(TEXT, nullable=False)
    description = Column(TEXT)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP, server_default=func.now())

