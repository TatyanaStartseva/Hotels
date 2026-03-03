from sqlalchemy import select, or_
from src.models.hotels import HotelsOrm
from src.repositories.base import BaseRepository
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
            t = title.strip()
            like_expr = f"%{t}%"
            query = query.where(
                or_(
                    self.model.title.ilike(like_expr),
                    getattr(self.model, "title_ru", None).ilike(like_expr)
                    if hasattr(self.model, "title_ru")
                    else False,
                )
            )

        if location:
            loc = location.strip()
            like_expr = f"%{loc}%"
            query = query.where(
                or_(
                    self.model.location.ilike(like_expr),
                    getattr(self.model, "location_ru", None).ilike(like_expr)
                    if hasattr(self.model, "location_ru")
                    else False,
                )
            )

        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        hotels = result.scalars().all()
        return [self.schema.model_validate(h, from_attributes=True) for h in hotels]

    async def get_hotel(self, id: int):
        query = select(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one()