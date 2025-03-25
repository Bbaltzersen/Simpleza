from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

# -------------------------
# Cauldron Schemas
# -------------------------

class CauldronBase(BaseModel):
    user_id: UUID
    recipe_id: UUID
    is_active: Optional[bool] = True

class CauldronCreate(CauldronBase):
    """
    Schema for creating a new Cauldron entry.
    """
    pass

class CauldronUpdate(BaseModel):
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True


class Cauldron(CauldronBase):
    """
    Schema for reading a Cauldron entry from the DB.
    """
    cauldron_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -------------------------
# CauldronData Schemas
# -------------------------

class CauldronDataBase(BaseModel):
    usage_count: Optional[int] = 0
    last_used: Optional[datetime] = None
    overall_rating: Optional[float] = None
    taste_rating: Optional[float] = None
    ease_rating: Optional[float] = None

class CauldronDataCreate(CauldronDataBase):
    """
    Schema for creating a new CauldronData entry.
    """
    cauldron_id: UUID

class CauldronData(CauldronDataBase):
    """
    Schema for reading CauldronData from the DB.
    """
    cauldron_data_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True

# -------------------------
# RecipeAnalytics Schemas
# -------------------------

class RecipeAnalyticsBase(BaseModel):
    recipe_id: UUID
    minimum_price: float
    total_calories: Optional[float] = None

class RecipeAnalyticsCreate(RecipeAnalyticsBase):
    """
    Schema for creating a new RecipeAnalytics entry.
    """
    pass

class RecipeAnalytics(RecipeAnalyticsBase):
    """
    Schema for reading RecipeAnalytics from the DB.
    """
    recipe_analytics_id: UUID
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
