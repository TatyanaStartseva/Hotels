from pydantic import BaseModel, Field, ConfigDict

class RoomAddRequest(BaseModel):
    title: str
    description: str | None = Field(None)
    price: int
    quantity: int


class RoomAdd(BaseModel):
    hotel_id: int
    title: str
    description: str | None = Field(None)
    price: int
    quantity: int
    available: int | None = None


class Room(RoomAdd):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PatchRoomRequest(BaseModel):
    title: str| None = Field(None)
    description: str | None = Field(None)
    price: int| None = Field(None)
    quantity: int| None = Field(None)


class PatchRoom(BaseModel):
    hotel_id: int| None = Field(None)
    title: str| None = Field(None)
    description: str | None = Field(None)
    price: int| None = Field(None)
    quantity: int| None = Field(None)

