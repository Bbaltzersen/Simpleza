import uuid
from sqlalchemy import Column, String, Index
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
from .base import Base
from .recipe_tag import RecipeTag

class Tag(Base):
    __tablename__ = "tags"

    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    name_tsv = Column(TSVECTOR)  # ✅ Full-text search column

    recipes = relationship("Recipe", secondary=RecipeTag, back_populates="tags")

    __table_args__ = (
        Index("idx_tag_name_tsv", "name_tsv", postgresql_using="gin"),  # ✅ Full-text search index
    )
