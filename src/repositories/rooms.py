from src.models.rooms import RoomsOrm
from src.repositories.base import BaseRepository
from sqlalchemy import  select

from src.schemas.rooms import Room


class RoomsRepositories(BaseRepository):
    model = RoomsOrm
    schema = Room


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