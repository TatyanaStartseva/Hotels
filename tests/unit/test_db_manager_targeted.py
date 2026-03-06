import pytest

from src.utils.db_manager import DBManager
import src.utils.db_manager as dbm


class DummySession:
    def __init__(self):
        self.closed = False
        self.rolled_back = False
        self.committed = False

    async def rollback(self):
        self.rolled_back = True

    async def close(self):
        self.closed = True

    async def commit(self):
        self.committed = True


class DummyRepo:
    def __init__(self, session):
        self.session = session


@pytest.mark.asyncio
async def test_db_manager_aenter_initializes_repositories(monkeypatch):
    session = DummySession()
    monkeypatch.setattr(dbm, 'HotelsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'RoomsRepositories', DummyRepo)
    monkeypatch.setattr(dbm, 'UsersRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'BookingsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'PetsRepository', DummyRepo)

    manager = DBManager(lambda: session)
    result = await manager.__aenter__()

    assert result is manager
    assert manager.session is session
    assert manager.hotels.session is session
    assert manager.rooms.session is session
    assert manager.users.session is session
    assert manager.bookings.session is session
    assert manager.pets.session is session


@pytest.mark.asyncio
async def test_db_manager_aexit_rolls_back_on_exception(monkeypatch):
    session = DummySession()
    monkeypatch.setattr(dbm, 'HotelsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'RoomsRepositories', DummyRepo)
    monkeypatch.setattr(dbm, 'UsersRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'BookingsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'PetsRepository', DummyRepo)

    manager = DBManager(lambda: session)
    await manager.__aenter__()
    await manager.__aexit__(RuntimeError, RuntimeError('boom'), None)

    assert session.rolled_back is True
    assert session.closed is True


@pytest.mark.asyncio
async def test_db_manager_aexit_without_exception_only_closes(monkeypatch):
    session = DummySession()
    monkeypatch.setattr(dbm, 'HotelsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'RoomsRepositories', DummyRepo)
    monkeypatch.setattr(dbm, 'UsersRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'BookingsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'PetsRepository', DummyRepo)

    manager = DBManager(lambda: session)
    await manager.__aenter__()
    await manager.__aexit__(None, None, None)

    assert session.rolled_back is False
    assert session.closed is True


@pytest.mark.asyncio
async def test_db_manager_commit_calls_session_commit(monkeypatch):
    session = DummySession()
    monkeypatch.setattr(dbm, 'HotelsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'RoomsRepositories', DummyRepo)
    monkeypatch.setattr(dbm, 'UsersRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'BookingsRepository', DummyRepo)
    monkeypatch.setattr(dbm, 'PetsRepository', DummyRepo)

    manager = DBManager(lambda: session)
    await manager.__aenter__()
    await manager.commit()

    assert session.committed is True
