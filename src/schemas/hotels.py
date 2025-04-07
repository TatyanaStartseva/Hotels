from pydantic import BaseModel, Field, ConfigDict

class HotelAdd(BaseModel):
    title: str
    location: str

class Hotel(HotelAdd):
    id : int
    model_config = ConfigDict(from_attributes=True)


class HotelPatch(BaseModel):
    title: str | None = Field(None)
    location: str | None = Field(None)