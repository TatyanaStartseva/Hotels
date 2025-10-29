# src/utils/db_manager.py (или где он у тебя лежит)
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.repositories.hotels import HotelsRepository
from src.repositories.rooms import RoomsRepositories
from src.repositories.users import UsersRepository


class DBManager:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self.session_factory = session_factory
        self.session: Optional[AsyncSession] = None
        # репозитории инициализируем позже
        self.hotels: Optional[HotelsRepository] = None
        self.rooms: Optional[RoomsRepositories] = None
        self.users: Optional[UsersRepository] = None

    async def __aenter__(self):
        # создаём новую асинхронную сессию
        self.session = self.session_factory()
        # пробрасываем одну и ту же сессию в репозитории
        self.hotels = HotelsRepository(self.session)
        self.rooms = RoomsRepositories(self.session)  # или RoomsRepository
        self.users = UsersRepository(self.session)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        # если было исключение — откатываем; иначе ничего не коммитим здесь
        # (коммит лучше вызывать явно через db.commit())
        try:
            if exc_type:
                await self.session.rollback()
        finally:
            await self.session.close()

    async def commit(self):
        await self.session.commit()
