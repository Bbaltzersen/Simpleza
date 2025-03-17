from sqlalchemy import Table, Column, ForeignKey, UUID
from .base import Base

RecipeTag = Table(
    "recipe_tags",
    Base.metadata,
    Column("recipe_id", UUID(as_uuid=True), ForeignKey("recipes.recipe_id"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.tag_id"), primary_key=True),
)
