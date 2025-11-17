from sqlalchemy import insert, select, update, delete

from src.models.bookings import  BookingsOrm
from src.repositories.base import BaseRepository
from pydantic import BaseModel

from src.schemas.bookings  import Bookings

class BookingsRepository(BaseRepository):
    model = BookingsOrm
    schema = Bookings



