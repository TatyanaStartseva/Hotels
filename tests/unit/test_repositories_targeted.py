from types import SimpleNamespace

import pytest

from src.repositories.hotels import HotelsRepository
from src.repositories.rooms import RoomsRepositories
from src.repositories.users import UsersRepository
from src.schemas.hotels import HotelAdd
from src.schemas.rooms import RoomAdd
from src.models.users import UsersOrm


class FakeScalars:
    def __init__(self, items=None, one_or_none_value=None, first_value=None, one_value=None):
        self._items = items or []
        self._one_or_none_value = one_or_none_value
        self._first_value = first_value
        self._one_value = one_value

    def all(self):
        return self._items

    def one_or_none(self):
        return self._one_or_none_value

    def first(self):
        return self._first_value

    def one(self):
        return self._one_value


class FakeResult:
    def __init__(
        self,
        *,
        items=None,
        one_or_none_value=None,
        first_value=None,
        one_value=None,
        scalar_one_value=None,
        scalar_one_or_none_value=None,
    ):
        self._scalars = FakeScalars(
            items=items,
            one_or_none_value=one_or_none_value,
            first_value=first_value,
            one_value=one_value,
        )
        self._scalar_one_value = scalar_one_value
        self._scalar_one_or_none_value = scalar_one_or_none_value

    def scalars(self):
        return self._scalars

    def scalar_one(self):
        return self._scalar_one_value

    def scalar_one_or_none(self):
        return self._scalar_one_or_none_value

class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.executed = []
        self.rollback_called = 0

    async def execute(self, query):
        self.executed.append(query)
        if not self.responses:
            raise AssertionError("No fake responses left for session.execute")
        return self.responses.pop(0)

    async def rollback(self):
        self.rollback_called += 1


@pytest.mark.asyncio
async def test_base_get_filtered_returns_validated_hotels():
    session = FakeSession(
        [
            FakeResult(
                items=[
                    SimpleNamespace(id=1, title="Hotel A", location="Moscow", images=[]),
                    SimpleNamespace(id=2, title="Hotel B", location="Sochi", images=[]),
                ]
            )
        ]
    )
    repo = HotelsRepository(session)

    result = await repo.get_filtered(location="Moscow")

    assert len(result) == 2
    assert result[0].id == 1
    assert result[0].title == "Hotel A"
    assert result[1].location == "Sochi"


@pytest.mark.asyncio
async def test_base_get_one_or_none_returns_none():
    session = FakeSession([FakeResult(one_or_none_value=None)])
    repo = HotelsRepository(session)

    result = await repo.get_one_or_none(id=999)

    assert result is None


@pytest.mark.asyncio
async def test_base_get_one_or_none_returns_validated_schema():
    session = FakeSession(
        [
            FakeResult(
                one_or_none_value=SimpleNamespace(
                    id=3, title="Hotel C", location="Kazan", images=[]
                )
            )
        ]
    )
    repo = HotelsRepository(session)

    result = await repo.get_one_or_none(id=3)

    assert result is not None
    assert result.id == 3
    assert result.title == "Hotel C"


@pytest.mark.asyncio
async def test_base_add_returns_validated_schema():
    session = FakeSession(
        [
            FakeResult(
                scalar_one_value=SimpleNamespace(
                    id=10, title="New Hotel", location="SPB", images=[]
                )
            )
        ]
    )
    repo = HotelsRepository(session)

    result = await repo.add(HotelAdd(title="New Hotel", location="SPB", images=[]))

    assert result.id == 10
    assert result.title == "New Hotel"
    assert result.location == "SPB"


@pytest.mark.asyncio
async def test_base_edit_returns_success_when_object_exists():
    session = FakeSession(
        [
            FakeResult(first_value=SimpleNamespace(id=7)),
            FakeResult(),
        ]
    )
    repo = HotelsRepository(session)

    result = await repo.edit(
        HotelAdd(title="Edited", location="Moscow", images=[]),
        id=7,
    )

    assert result == {"status": "success"}


@pytest.mark.asyncio
async def test_base_edit_returns_error_when_object_not_found():
    session = FakeSession([FakeResult(first_value=None)])
    repo = HotelsRepository(session)

    result = await repo.edit(
        HotelAdd(title="Edited", location="Moscow", images=[]),
        id=777,
    )

    assert result["status"] == "error"
    assert "не найден" in result["message"].lower()


@pytest.mark.asyncio
async def test_base_delete_returns_deleted_object_when_found():
    deleted = SimpleNamespace(id=5, title="Deleted Hotel")
    session = FakeSession(
        [
            FakeResult(first_value=SimpleNamespace(id=5)),
            FakeResult(scalar_one_value=deleted),
        ]
    )
    repo = HotelsRepository(session)

    result = await repo.delete(id=5)

    assert result.id == 5
    assert result.title == "Deleted Hotel"


@pytest.mark.asyncio
async def test_base_delete_returns_error_when_not_found():
    session = FakeSession([FakeResult(first_value=None)])
    repo = HotelsRepository(session)

    result = await repo.delete(id=404)

    assert result["status"] == "error"
    assert "не найден" in result["message"].lower()


@pytest.mark.asyncio
async def test_hotels_repository_get_all_returns_filtered_hotels():
    session = FakeSession(
        [
            FakeResult(
                items=[
                    SimpleNamespace(id=1, title="Alpha", location="Moscow", images=[]),
                    SimpleNamespace(id=2, title="Beta", location="Moscow", images=[]),
                ]
            )
        ]
    )
    repo = HotelsRepository(session)

    result = await repo.get_all(location_variants=["Moscow"], title=None, id=None, limit=10, offset=0)

    assert len(result) == 2
    assert result[0].title == "Alpha"
    assert result[1].title == "Beta"


@pytest.mark.asyncio
async def test_hotels_repository_get_hotel_returns_scalar_one():
    hotel_obj = SimpleNamespace(id=11, title="Single", location="Perm", images=[])
    session = FakeSession([FakeResult(scalar_one_value=hotel_obj)])
    repo = HotelsRepository(session)

    result = await repo.get_hotel(11)

    assert result.id == 11
    assert result.title == "Single"


@pytest.mark.asyncio
async def test_rooms_repository_get_room_returns_scalar_one():
    room_obj = SimpleNamespace(
        id=9,
        hotel_id=3,
        title="Suite",
        description="Big room",
        price=10000,
        quantity=1,
        available=1,
    )
    session = FakeSession([FakeResult(scalar_one_or_none_value=room_obj)])
    repo = RoomsRepositories(session)

    result = await repo.get_room(9)

    assert result.id == 9
    assert result.title == "Suite"




@pytest.mark.asyncio
async def test_users_repository_get_user_with_hashed_password_returns_schema(monkeypatch):
    user_obj = SimpleNamespace(
        id=1,
        email="user@example.com",
        hashed_password="hashed",
        is_admin=False,
    )
    session = FakeSession([FakeResult(one_value=user_obj)])
    repo = UsersRepository(session)

    result = await repo.get_user_with_hashed_password("user@example.com")

    assert result.id == 1
    assert result.email == "user@example.com"
    assert result.hashed_password == "hashed"
    assert result.is_admin is False