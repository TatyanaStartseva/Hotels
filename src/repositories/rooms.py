from datetime import date

from src.models.bookings import BookingsOrm
from src.models.rooms import RoomsOrm
from src.repositories.base import BaseRepository
from sqlalchemy import  select, func, and_

from src.schemas.rooms import Room


class RoomsRepositories(BaseRepository):
    model = RoomsOrm
    schema = Room

    async def get_with_availability(self, hotel_id: int, date_from: date, date_to: date):
        rooms = (await self.session.execute(
            select(RoomsOrm).where(RoomsOrm.hotel_id == hotel_id)
        )).scalars().all()

        result = []
        for room in rooms:
            booked = (await self.session.execute(
                select(func.count(BookingsOrm.id))
                .where(
                    BookingsOrm.room_id == room.id,
                    BookingsOrm.date_from < date_to,   # пересечение интервалов
                    BookingsOrm.date_to > date_from,
                )
            )).scalar_one()

            available = max(0, room.quantity - booked)

            result.append({
                "id": room.id,
                "title": room.title,
                "price": room.price,
                "quantity": room.quantity,
                "available": available,
            })

        return result

    async def get_all(self,hotel_id,title,description,price,quantity):
        query = select(self.model)
        if hotel_id:
            query = query.filter_by(hotel_id=hotel_id)
        if title:
            query= query.filter_by(title=title)
        if description:
            query= query.filter_by(description=description)
        if price:
            query= query.filter_by(price=price)
        if quantity:
            query= query.filter_by(quantity=quantity)
        result  = await  self.session.execute(query)
        return [self.schema.model_validate(room, from_attributes=True) for room in result.scalars().all()]


    async def get_room(self, id):
        query = select(self.model).filter_by(id=id)
        result = await self.session.execute(query)
        return result.scalar_one()