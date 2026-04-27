from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class UserRequestAdd(BaseModel):
    email: EmailStr
    password: str


class UserAdd(BaseModel):
    email: EmailStr
    hashed_password: str
    is_admin: bool = False
    subscription_status: str = "free"


class User(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool = False

    subscription_plan: str | None = None
    subscription_status: str = "free"
    subscription_ends_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserWithHashedPassword(User):
    hashed_password: str