from pydantic import BaseModel, Field

class Hotel(BaseModel):
    title: str
    name: str


class HotelPatch(BaseModel):
    id: int | None = Field(None)
    title: str | None = Field(None)