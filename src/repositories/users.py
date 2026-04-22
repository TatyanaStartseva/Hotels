from sqlalchemy import select, update
from pydantic import EmailStr
from src.models.users import UsersOrm
from src.repositories.base import BaseRepository
from src.schemas.users import User , UserWithHashedPassword


class UsersRepository(BaseRepository):
    model = UsersOrm
    schema = User

    async def get_all(self):
        query = select(self.model).order_by(self.model.id)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_user_with_hashed_password(self, email: EmailStr):
        query = select(self.model).filter_by(email=email)
        result = await self.session.execute(query)
        model = result.scalars().one()
        return UserWithHashedPassword.model_validate(model)

    async def edit(self, data: dict, **filter_by):
        query = (
            update(UsersOrm)
            .where(*[getattr(UsersOrm, k) == v for k, v in filter_by.items()])
            .values(**data)
        )
        await self.session.execute(query)