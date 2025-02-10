from sqlalchemy import Column, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class RecipeFavorite(Base):
    __tablename__ = "recipe_favorites"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), primary_key=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    favorited_at = Column(TIMESTAMP, server_default=func.now())