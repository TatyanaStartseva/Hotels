from pydantic import BaseModel, Field, ConfigDict
# Создаем схемы данных, их типы, чтобы потом использовать в ручках, пайдентик автоматически будет проверять тип данных,
# который мы передаем. И чтобы fastapi в ручке мог принять такой класс, наследуемся от базовой модели

class HotelAdd(BaseModel):
    title: str
    location: str

class Hotel(HotelAdd):
    id : int
    model_config = ConfigDict(from_attributes=True) # приводим ответ Алхимии к виду словаря, чтобы пайдентик мог с ним работать


class HotelPatch(BaseModel):
    title: str | None = Field(None)
    location: str | None = Field(None)