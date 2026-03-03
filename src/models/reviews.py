from datetime import datetime
from sqlalchemy import ForeignKey, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class ReviewOrm(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)

    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        unique=True,
        index=True,
    )

    rating: Mapped[int] = mapped_column(Integer)  # 1..5
    text: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_reply_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)