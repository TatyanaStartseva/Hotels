from pydantic import BaseModel, Field, ConfigDict

class HotelAdd(BaseModel):
    title: str
    location: str

class Hotel(HotelAdd):
    id : int
    model_config = ConfigDict(from_attributes=True) # приводим ответ Алхимии к виду словаря, чтобы пайдентик мог с ним работать


class HotelPatch(BaseModel):
    title: str | None = Field(None)
    location: str | None = Field(None)