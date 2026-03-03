from pydantic import BaseModel, ConfigDict


class HotelMini(BaseModel):
    id: int
    name: str | None = None
    location: str | None = None
    model_config = ConfigDict(from_attributes=True)


class RoomSearchOut(BaseModel):
    id: int
    hotel_id: int
    title: str
    price: int
    quantity: int
    available: int | None = None

    # ✅ политика комнаты
    allowed_species: list | None = None
    temp_min: float | None = None
    temp_max: float | None = None
    humidity_min: float | None = None
    humidity_max: float | None = None
    room_conditions: str | None = None
    vaccinations_required: list | None = None
    chip_required: bool = False
    diet_supported: list | None = None
    feedings_per_day_max: int | None = None
    license_required: bool = False
    cohabitation_allowed: bool = True

    hotel: HotelMini

    model_config = ConfigDict(from_attributes=True)
