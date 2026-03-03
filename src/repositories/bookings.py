from sqlalchemy import select

from src.models.bookings import BookingsOrm
from src.repositories.base import BaseRepository
from src.schemas.bookings import Booking


class BookingsRepository(BaseRepository):
    model = BookingsOrm
    schema = Booking

    async def get_by_id(self, booking_id: int):
        q = select(self.model).where(self.model.id == booking_id)
        res = await self.session.execute(q)
        return res.scalar_one_or_none()