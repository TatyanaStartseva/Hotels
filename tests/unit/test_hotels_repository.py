import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from src.repositories.hotels import HotelsRepository


class FakeScalarResult:
    def __init__(self, values):
        self._values = values

    def all(self):
        return self._values


class FakeExecuteResult:
    def __init__(self, values):
        self._values = values

    def scalars(self):
        return FakeScalarResult(self._values)


@pytest.mark.asyncio
async def test_get_all_returns_hotels_with_images():
    session = AsyncMock()

    fake_hotels = [
        SimpleNamespace(
            id=1,
            title="Hotel One",
            location="Moscow",
            location_ru="Москва",
            title_ru="Отель Один",
            images=["img1.jpg", "img2.jpg"],
        ),
        SimpleNamespace(
            id=2,
            title="Hotel Two",
            location="SPB",
            location_ru="Санкт-Петербург",
            title_ru="Отель Два",
            images=["img3.jpg"],
        ),
    ]

    session.execute.return_value = FakeExecuteResult(fake_hotels)

    repo = HotelsRepository(session)

    result = await repo.get_all()

    assert len(result) == 2
    assert result[0].title == "Hotel One"
    assert result[0].images == ["img1.jpg", "img2.jpg"]
    assert result[1].images == ["img3.jpg"]