from datetime import datetime
from sqlalchemy import select, update
from src.repositories.base import BaseRepository
from src.models.reviews import ReviewOrm
from src.schemas.reviews import ReviewOut


class ReviewsRepository(BaseRepository):
    model = ReviewOrm
    schema = ReviewOut

    async def list_by_hotel(self, hotel_id: int, limit: int = 100, offset: int = 0):
        q = (
            select(self.model)
            .where(self.model.hotel_id == hotel_id)
            .order_by(self.model.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        res = await self.session.execute(q)
        rows = res.scalars().all()
        return [self.schema.model_validate(x, from_attributes=True) for x in rows]

    async def get_by_id(self, review_id: int):
        q = select(self.model).where(self.model.id == review_id)
        res = await self.session.execute(q)
        return res.scalar_one_or_none()

    async def create(self, hotel_id: int, user_id: int, booking_id: int, rating: int, text: str):
        obj = self.model(
            hotel_id=hotel_id,
            user_id=user_id,
            booking_id=booking_id,
            rating=rating,
            text=text,
        )
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def set_reply(self, review_id: int, reply_text: str):
        q = (
            update(self.model)
            .where(self.model.id == review_id)
            .values(owner_reply=reply_text, owner_reply_at=datetime.utcnow())
            .returning(self.model)
        )
        res = await self.session.execute(q)
        return res.scalar_one_or_none()