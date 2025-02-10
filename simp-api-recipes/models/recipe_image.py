import uuid
from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, TEXT
from .base import Base

class RecipeImage(Base):
    __tablename__ = "recipe_images"

    image_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"))
    image_url = Column(TEXT, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
