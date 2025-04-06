from pydantic import BaseModel, EmailStr, Field, field_validator, model_serializer
from uuid import UUID
import re

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    role: str

    @model_serializer
    def serialize(self):
        return {
            "user_id": str(self.user_id),  # Convert UUID to string during serialization
            "username": self.username,
            "email": self.email,
            "role": self.role
        }