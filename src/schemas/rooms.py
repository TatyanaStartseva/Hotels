from pydantic import BaseModel, Field

class RoomAdd(BaseModel):
    hotel_id: int
    title: str
    price: int
    quantity: int

class Room(RoomAdd):
    id: int



class PatchRoom(BaseModel):
    description: str | None= Field(None)

