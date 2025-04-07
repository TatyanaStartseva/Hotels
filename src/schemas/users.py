from pydantic import BaseModel, Field, ConfigDict, EmailStr


class UsersRequestAdd(BaseModel):
    email: EmailStr
    password: str

class UserAdd(BaseModel):
    email: EmailStr
    hashed_password: str

class User(BaseModel):
    id : int
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)


