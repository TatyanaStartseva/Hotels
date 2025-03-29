from pydantic import BaseModel, Field

class Hotel(BaseModel):
    title: str
    location: str


class HotelPatch(BaseModel):
    id: int | None = Field(None)
    title: str | None = Field(None)
    location: str | None = Field(None)