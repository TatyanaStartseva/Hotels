from sqlalchemy import insert, select, update, delete

from src.models.hotels import HotelsOrm
from src.repositories.base import BaseRepository
from pydantic import BaseModel

from src.schemas.hotels import Hotel


class HotelsRepository(BaseRepository):
    model = HotelsOrm
    schema = Hotel
    async def get_all(
        self,
        id: int | None = None,
        location: str | None = None,
        title: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ):
        query = select(self.model)

        if id is not None:
            query = query.where(self.model.id == id)

        if title:
            like_expr = f"%{title}%"
            query = query.where(self.model.title.ilike(like_expr))

        if location:
            like_expr = f"%{location}%"
            query = query.where(self.model.location.ilike(like_expr))

        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        hotels = result.scalars().all()
        return [
            self.schema.model_validate(hotel, from_attributes=True)
            for hotel in hotels
        ]

    async def get_hotel(self, id: int):
        query = select(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one()


