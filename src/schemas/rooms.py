from pydantic import BaseModel, Field, ConfigDict


class RoomAddRequest(BaseModel):
    title: str
    description: str | None = Field(None)
    price: int
    quantity: int

    allowed_species: list[str] | None = None
    temp_min: float | None = None
    temp_max: float | None = None
    humidity_min: float | None = None
    humidity_max: float | None = None
    room_conditions: str | None = None

    vaccinations_required: list[str] | None = None
    chip_required: bool = False

    diet_supported: list[str] | None = None
    feedings_per_day_max: int | None = None

    license_required: bool = False
    cohabitation_allowed: bool = True


class RoomAdd(RoomAddRequest):
    hotel_id: int


class Room(RoomAdd):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PatchRoomRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    price: int | None = None
    quantity: int | None = None

    allowed_species: list[str] | None = None
    temp_min: float | None = None
    temp_max: float | None = None
    humidity_min: float | None = None
    humidity_max: float | None = None
    room_conditions: str | None = None

    vaccinations_required: list[str] | None = None
    chip_required: bool | None = None

    diet_supported: list[str] | None = None
    feedings_per_day_max: int | None = None

    license_required: bool | None = None
    cohabitation_allowed: bool | None = None


class PatchRoom(PatchRoomRequest):
    hotel_id: int | None = None