from pydantic import BaseModel, Field, ConfigDict
# Создаем схемы данных, их типы, чтобы потом использовать в ручках, пайдентик автоматически будет проверять тип данных,
# который мы передаем. И чтобы fastapi в ручке мог принять такой класс, наследуемся от базовой модели
from typing import List, Literal

class HotelOwnerCreate(BaseModel):
    title: str
    location: str
    images: list[str] = Field(default_factory=list)
    location_ru: str | None = None
    title_ru: str | None = None

class HotelAdd(HotelOwnerCreate):
    owner_id: int | None = None
    status: Literal["draft", "published", "archived"] = "draft"

class Hotel(HotelAdd):
    id : int
    images: List[str] = []
    model_config = ConfigDict(from_attributes=True) # приводим ответ Алхимии к виду словаря, чтобы пайдентик мог с ним работать


class HotelPatch(BaseModel):
    title: str | None = Field(None)
    location: str | None = Field(None)
    images: list[str] | None = None
    location_ru: str | None = None
    title_ru: str | None = None

class HotelStatusPatch(BaseModel):
    status: Literal["draft", "published", "archived"]