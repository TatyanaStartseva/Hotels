from src.repositories.hotels import HotelsRepository
from src.repositories.rooms import RoomsRepositories
from src.repositories.users import UsersRepository


class DBManager:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def __aenter__(self):
        self.session = self.session_factory

        self.hotels = HotelsRepository(self.session)
        self.rooms= RoomsRepositories(self.session)
        self.users = UsersRepository(self.session)
        return self

    async def __aexit__(self):
        await self.session.rollback()
        await self.session.close()

    async def commit(self):
        await self.session.commit()