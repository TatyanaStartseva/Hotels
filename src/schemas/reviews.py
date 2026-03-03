from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReviewAdd(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=5000)


class ReviewReply(BaseModel):
    owner_reply: str = Field(min_length=1, max_length=5000)


class ReviewOut(BaseModel):
    id: int
    hotel_id: int
    user_id: int
    booking_id: int
    rating: int
    text: str
    created_at: datetime
    owner_reply: str | None = None
    owner_reply_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)