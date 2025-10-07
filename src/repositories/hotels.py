from sqlalchemy import insert, select, update, delete

from src.models.hotels import HotelsOrm
from src.repositories.base import BaseRepository
from pydantic import BaseModel

from src.schemas.hotels import Hotel


class HotelsRepository(BaseRepository):
    model = HotelsOrm
    schema = Hotel
    async def get_all(self,id,location,title,limit,offset):
            query = select(self.model)
            if id:
                query = query.filter_by(id=id)
            if title:
                query = query.filter_by(title=title)
            if location:
                query = query.filter(self.model.location.ilike(f"%{location}%"))
            query = (
                query
                .limit(limit)
                .offset(offset)
            )

            result = await self.session.execute(query)
            return [self.schema.model_validate(hotel, from_attributes=True) for hotel in result.scalars().all()]


    async def get_hotel(self,id:int):
        query = select(self.model).filter_by(id=id)
        result = await self.session.execute(query)
        return result.scalar_one()


