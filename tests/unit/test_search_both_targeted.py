from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from src.services import search_both as mod


def test_extract_hotels_none_and_dict_items_wrapper():
    assert mod._extract_hotels(None) == []
    assert mod._extract_hotels({"items": [{"id": 1, "title": "A", "location": "MOW"}]}) == [
        {"id": 1, "title": "A", "location": "MOW"}
    ]


def test_extract_hotels_supports_objects():
    items = [SimpleNamespace(id=2, title="B", location="LED")]
    assert mod._extract_hotels(items) == [{"id": 2, "title": "B", "location": "LED"}]


@pytest.mark.asyncio
async def test_ensure_hotel_returns_false_when_found(fake_db):
    result = await mod._ensure_hotel(fake_db, title="Sochi Grand", location="AER")
    assert result is False


@pytest.mark.asyncio
async def test_ensure_hotel_creates_when_missing(fake_db):
    result = await mod._ensure_hotel(fake_db, title="Brand New", location="KZN")
    assert result is True
    assert any(h.title == "Brand New" for h in fake_db.hotels_store.values())


@pytest.mark.asyncio
async def test_amadeus_fetch_extracts_titles(monkeypatch):
    class DummyAmadeus:
        async def search_offers_by_city(self, **kwargs):
            return [
                {"hotel": {"name": "Hotel One"}},
                {"hotel": {"name": "  Hotel Two  "}},
                {"hotel": {}},
                {},
            ]

    monkeypatch.setattr(mod, "AmadeusClient", DummyAmadeus)
    result = await mod._amadeus_fetch("MOW", "2030-01-01", "2030-01-02", 1, 10)
    assert result == [{"title": "Hotel One"}, {"title": "Hotel Two"}]


@pytest.mark.asyncio
async def test_xotelo_fetch_returns_empty_on_non_dict(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return "not-a-dict"

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 1, 20, False)
    assert result == []


@pytest.mark.asyncio
async def test_xotelo_fetch_returns_empty_on_search_error(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return {"_error": {"status": 451, "message": "blocked"}}

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 1, 20, False)
    assert result == []


@pytest.mark.asyncio
async def test_xotelo_fetch_returns_empty_when_location_key_missing(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return {"result": {"items": [{"name": "x"}]}}

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 1, 20, False)
    assert result == []


@pytest.mark.asyncio
async def test_xotelo_fetch_returns_empty_on_bad_listing(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return {"result": {"items": [{"location_key": "loc1"}]}}

        async def list_hotels(self, location_key, limit, offset):
            return "bad-listing"

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 1, 20, False)
    assert result == []


@pytest.mark.asyncio
async def test_xotelo_fetch_collects_hotels_without_rates(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return {"result": {"list": [{"location_key": "loc1"}]}}

        async def list_hotels(self, location_key, limit, offset):
            return {
                "result": {
                    "hotels": [
                        {"name": "XO One", "hotel_key": "h1"},
                        {"hotel_name": "XO Two", "key": "h2"},
                        "skip-me",
                        {"name": ""},
                    ]
                }
            }

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 1, 20, False)
    assert result == [
        {"title": "XO One", "hotel_key": "h1"},
        {"title": "XO Two", "hotel_key": "h2"},
    ]


@pytest.mark.asyncio
async def test_xotelo_fetch_attaches_rates_when_requested(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return {"result": {"list": [{"location_key": "loc1"}]}}

        async def list_hotels(self, location_key, limit, offset):
            return {"result": {"hotels": [{"name": "XO One", "hotel_key": "h1"}]}}

        async def rates(self, hkey, chk_in, chk_out, adults):
            return {"price": 123}

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 2, 20, True)
    assert result[0]["rates"] == {"price": 123}


@pytest.mark.asyncio
async def test_xotelo_fetch_ignores_rates_exceptions(monkeypatch):
    class DummyXotelo:
        async def search(self, city_input):
            return {"result": {"list": [{"location_key": "loc1"}]}}

        async def list_hotels(self, location_key, limit, offset):
            return {"result": {"hotels": [{"name": "XO One", "hotel_key": "h1"}]}}

        async def rates(self, hkey, chk_in, chk_out, adults):
            raise RuntimeError("boom")

    monkeypatch.setattr("src.clients.xotelo.XoteloClient", DummyXotelo)
    result = await mod._xotelo_fetch("Moscow", "2030-01-01", "2030-01-02", 2, 20, True)
    assert result == [{"title": "XO One", "hotel_key": "h1"}]


@pytest.mark.asyncio
async def test_search_hotels_read_through_both_returns_error_on_unknown_city(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return None

    monkeypatch.setattr(mod, "AmadeusClient", DummyAmadeus)
    result = await mod.search_hotels_read_through_both(
        fake_db,
        city_input="Unknown",
        check_in="2030-01-01",
        check_out="2030-01-02",
        adults=1,
        providers="both",
        max_hotels_amadeus=10,
        limit_hotels_xotelo=10,
        with_rates=False,
        alias_location=False,
    )
    assert "error" in result


@pytest.mark.asyncio
async def test_search_hotels_read_through_both_uses_iata_input_without_resolve(fake_db, monkeypatch):
    class DummyAmadeus:
        def __init__(self):
            self.called = False

        async def resolve_city_code(self, city_input):
            raise AssertionError("should not be called for IATA input")

    monkeypatch.setattr(mod, "AmadeusClient", DummyAmadeus)
    monkeypatch.setattr(mod, "_amadeus_fetch", AsyncMock(return_value=[]))
    monkeypatch.setattr(mod, "_xotelo_fetch", AsyncMock(return_value=[]))

    result = await mod.search_hotels_read_through_both(
        fake_db,
        city_input="mow",
        check_in="2030-01-01",
        check_out="2030-01-02",
        adults=1,
        providers="both",
        max_hotels_amadeus=10,
        limit_hotels_xotelo=10,
        with_rates=False,
        alias_location=False,
    )
    assert result["city"]["code"] == "MOW"


@pytest.mark.asyncio
async def test_search_hotels_read_through_both_deduplicates_and_commits(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return "AER"

    monkeypatch.setattr(mod, "AmadeusClient", DummyAmadeus)
    monkeypatch.setattr(mod, "_amadeus_fetch", AsyncMock(return_value=[
        {"title": "Sochi Grand"},
        {"title": "Sea Breeze"},
    ]))
    monkeypatch.setattr(mod, "_xotelo_fetch", AsyncMock(return_value=[
        {"title": "Sea Breeze", "hotel_key": "x1"},
        {"title": "Mountain View", "hotel_key": "x2"},
    ]))
    fake_db.commit = AsyncMock()

    result = await mod.search_hotels_read_through_both(
        fake_db,
        city_input="Sochi",
        check_in="2030-01-01",
        check_out="2030-01-02",
        adults=1,
        providers="both",
        max_hotels_amadeus=10,
        limit_hotels_xotelo=10,
        with_rates=False,
        alias_location=False,
    )

    assert result["stats"]["db_before"] == 1
    assert result["stats"]["new_candidates"] == 2
    assert result["stats"]["inserted"] == 2
    assert result["providers"]["amadeus_count"] == 2
    assert result["providers"]["xotelo_count"] == 2
    fake_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_search_hotels_read_through_both_alias_location(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return "LED"

    monkeypatch.setattr(mod, "AmadeusClient", DummyAmadeus)
    monkeypatch.setattr(mod, "_amadeus_fetch", AsyncMock(return_value=[{"title": "Neva"}]))
    monkeypatch.setattr(mod, "_xotelo_fetch", AsyncMock(return_value=[]))
    fake_db.commit = AsyncMock()

    await mod.search_hotels_read_through_both(
        fake_db,
        city_input="Saint Petersburg",
        check_in="2030-01-01",
        check_out="2030-01-02",
        adults=1,
        providers="amadeus",
        max_hotels_amadeus=10,
        limit_hotels_xotelo=10,
        with_rates=False,
        alias_location=True,
    )
    assert any(h.location == "LED Saint Petersburg" for h in fake_db.hotels_store.values())


@pytest.mark.asyncio
async def test_search_hotels_read_through_both_skips_commit_when_no_new_hotels(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return "AER"

    monkeypatch.setattr(mod, "AmadeusClient", DummyAmadeus)
    monkeypatch.setattr(mod, "_amadeus_fetch", AsyncMock(return_value=[{"title": "Sochi Grand"}]))
    monkeypatch.setattr(mod, "_xotelo_fetch", AsyncMock(return_value=[]))
    fake_db.commit = AsyncMock()

    result = await mod.search_hotels_read_through_both(
        fake_db,
        city_input="Sochi",
        check_in="2030-01-01",
        check_out="2030-01-02",
        adults=1,
        providers="amadeus",
        max_hotels_amadeus=10,
        limit_hotels_xotelo=10,
        with_rates=False,
        alias_location=False,
    )
    assert result["stats"]["inserted"] == 0
    fake_db.commit.assert_not_called()
