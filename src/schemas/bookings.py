from pydantic import BaseModel, ConfigDict,Field
from datetime import date

class BookingsAdd(BaseModel):
    user_id:int
    date_to: date
    date_from: date
    room_id: int

class Bookings(BookingsAdd):
    price: int | None = Field(None)
    model_config = ConfigDict(from_attributes=True)
