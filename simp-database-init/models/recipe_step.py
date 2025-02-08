import uuid
from sqlalchemy import Column, ForeignKey, Integer, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    step_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"))
    step_number = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())