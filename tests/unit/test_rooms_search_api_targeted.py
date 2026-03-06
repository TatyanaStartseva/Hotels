from types import SimpleNamespace

import pytest

from src.api.rooms_search import rooms_search


@pytest.mark.asyncio
async def test_rooms_search_returns_serialized_rows(fake_db):
    room = SimpleNamespace(id=1, hotel_id=1, title="Suite", price=100, quantity=2, available=1)
    hotel = SimpleNamespace(id=1, title="Sochi Grand", location="AER")
    fake_db.session_rows = [(room, hotel)]

    result = await rooms_search(fake_db)

    assert result == [
        {
            "id": 1,
            "hotel_id": 1,
            "title": "Suite",
            "price": 100,
            "quantity": 2,
            "available": 1,
            "hotel": {"id": 1, "title": "Sochi Grand", "location": "AER"},
        }
    ]


@pytest.mark.asyncio
async def test_rooms_search_builds_query_with_all_filters(fake_db):
    room = SimpleNamespace(id=2, hotel_id=5, title="Pet room", price=300, quantity=4)
    hotel = SimpleNamespace(id=5, title="Pet Hotel", location="MOW")
    fake_db.session_rows = [(room, hotel)]

    result = await rooms_search(
        fake_db,
        q="Moscow",
        species="cat",
        temperature_min=20,
        temperature_max=28,
        humidity_min=40,
        humidity_max=60,
        conditions="quiet",
        diet_type="natural",
        feedings_per_day=3,
        license_required=False,
        cohabitation_allowed=True,
        vaccinations=["rabies", "flu"],
    )

    assert result[0]["title"] == "Pet room"
    assert result[0]["hotel"]["title"] == "Pet Hotel"


@pytest.mark.asyncio
async def test_rooms_search_empty_vaccination_list_works(fake_db):
    room = SimpleNamespace(id=3, hotel_id=7, title="Basic", price=150, quantity=1)
    hotel = SimpleNamespace(id=7, title="Basic Hotel", location="LED")
    fake_db.session_rows = [(room, hotel)]

    result = await rooms_search(fake_db, vaccinations=[])
    assert result[0]["hotel"]["location"] == "LED"
