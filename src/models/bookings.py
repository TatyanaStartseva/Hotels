from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import String, ForeignKey
from datetime import date


class BookingsOrm(Base):
    __tablename__ = "bookings"

    id:Mapped[int]=  mapped_column(primary_key=True)
    user_id:Mapped[int] =mapped_column(ForeignKey("users.id"))
    room_id: Mapped[int]=mapped_column(ForeignKey("rooms.id"))
    date_to: Mapped[date]
    date_from: Mapped[date]
    price: Mapped[int]

    @hybrid_property
    def total_cost(self)->int:
        return self.price * (self.date_to - self.date_from).days