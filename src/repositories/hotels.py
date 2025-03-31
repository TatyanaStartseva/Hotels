from sqlalchemy import insert, select

from src.models.hotels import HotelsOrm
from src.repositories.base import BaseRepository


class HotelsRepository(BaseRepository):
    model = HotelsOrm
    async def get_all(self,location,title,limit,offset):
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
            hotels = result.scalars().all()
            return hotels

    async def add(self,**hotel_data):
        add_hotel_stmt = insert(self.model).values(**hotel_data.model_dump().returning(self.model))
        print(add_hotel_stmt.compile(compile_kwargs={"literal_binds": True}))
        result = await self.session.execute(add_hotel_stmt)
        return result.scalar_one()