from datetime import date

from sqlalchemy import select, func

from src.models.bookings import BookingsOrm
from src.models.rooms import RoomsOrm
from src.repositories.base import BaseRepository
from src.schemas.rooms import Room


class RoomsRepositories(BaseRepository):
    model = RoomsOrm
    schema = Room

    async def get_with_availability(self, hotel_id: int, date_from: date, date_to: date):
        rooms = (
            await self.session.execute(
                select(RoomsOrm).where(RoomsOrm.hotel_id == hotel_id)
            )
        ).scalars().all()

        result = []
        for room in rooms:
            booked = (
                await self.session.execute(
                    select(func.count(BookingsOrm.id))
                    .where(
                        BookingsOrm.room_id == room.id,
                        BookingsOrm.date_from < date_to,  # пересечение интервалов
                        BookingsOrm.date_to > date_from,
                    )
                )
            ).scalar_one()

            available = max(0, room.quantity - booked)

            # ✅ возвращаем ВСЕ поля комнаты + available
            result.append({
                "id": room.id,
                "hotel_id": room.hotel_id,
                "title": room.title,
                "description": room.description,
                "price": room.price,
                "quantity": room.quantity,
                "available": available,

                "allowed_species": room.allowed_species,
                "temp_min": room.temp_min,
                "temp_max": room.temp_max,
                "humidity_min": room.humidity_min,
                "humidity_max": room.humidity_max,
                "room_conditions": room.room_conditions,

                "vaccinations_required": room.vaccinations_required,
                "chip_required": room.chip_required,

                "diet_supported": room.diet_supported,
                "feedings_per_day_max": room.feedings_per_day_max,

                "license_required": room.license_required,
                "cohabitation_allowed": room.cohabitation_allowed,
            })

        return result