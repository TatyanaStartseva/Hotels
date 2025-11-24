from pydantic import BaseModel, Field, ConfigDict, EmailStr


class UserRequestAdd(BaseModel):
    email: EmailStr
    password: str

class UserAdd(BaseModel):
    email: EmailStr
    hashed_password: str
    is_admin: bool = False

class User(BaseModel):
    id : int
    email: EmailStr
    is_admin: bool = False
    model_config = ConfigDict(from_attributes=True)


class UserWithHashedPassword(User):
    hashed_password: str