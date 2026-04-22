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
            location_variants: list[str] | None = None,
            title: str | None = None,
            limit: int = 10,
            offset: int = 0,
            only_published: bool = True,
            owner_id: int | None = None,
    ):
        query = select(self.model)

        if only_published:
            query = query.where(self.model.status == "published")

        if owner_id is not None:
            query = query.where(self.model.owner_id == owner_id)

        if id is not None:
            query = query.where(self.model.id == id)

        if title:
            t = title.strip()
            like_expr = f"%{t}%"

            conditions = [self.model.title.ilike(like_expr)]
            if hasattr(self.model, "title_ru"):
                conditions.append(self.model.title_ru.ilike(like_expr))

            query = query.where(or_(*conditions))

        if location_variants:
            location_conditions = []

            for loc in location_variants:
                loc = loc.strip()
                if not loc:
                    continue

                like_expr = f"%{loc}%"
                location_conditions.append(self.model.location.ilike(like_expr))

                if hasattr(self.model, "location_ru"):
                    location_conditions.append(self.model.location_ru.ilike(like_expr))

            if location_conditions:
                query = query.where(or_(*location_conditions))

        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        hotels = result.scalars().all()
        return [self.schema.model_validate(h, from_attributes=True) for h in hotels]
    async def get_hotel(self, id: int):
        query = select(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one()