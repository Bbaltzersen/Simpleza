from pydantic import BaseModel
import uuid
from typing import Optional

# Request model for adding density
class DensityCreate(BaseModel):
    ingredient_id: uuid.UUID
    density: float  # Density in g/ml

# Response model for returning density data
class DensityOut(BaseModel):
    density_id: uuid.UUID
    ingredient_id: uuid.UUID
    density: float

    class Config:
        orm_mode = True
