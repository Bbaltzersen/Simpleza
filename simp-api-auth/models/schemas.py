from pydantic import BaseModel, EmailStr, Field
import re
import uuid

# Custom password validator
def validate_password(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character.")
    return password

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=8)

    # Custom password validation
    @classmethod
    def validate(cls, values):
        values["password"] = validate_password(values["password"])
        return values

class UserLogin(BaseModel):  # 🚀 Make sure this exists
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    email: EmailStr
    role: str
