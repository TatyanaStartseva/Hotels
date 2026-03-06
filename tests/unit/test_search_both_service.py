from unittest.mock import AsyncMock

import pytest

from src.services import search_both as search_both_module


def test_search_both_extract_hotels_supports_items_key():
    payload = {'items': [{'id': 1, 'title': 'X', 'location': 'LED'}]}
    assert search_both_module._extract_hotels(payload) == [
        {'id': 1, 'title': 'X', 'location': 'LED'}
    ]


@pytest.mark.asyncio
async def test_search_both_returns_error_when_city_cannot_be_resolved(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return None

    monkeypatch.setattr(search_both_module, 'AmadeusClient', DummyAmadeus)

    result = await search_both_module.search_hotels_read_through_both(
        db=fake_db,
        city_input='UnknownCity',
        check_in='2030-01-10',
        check_out='2030-01-12',
        adults=1,
        providers='both',
        max_hotels_amadeus=100,
        limit_hotels_xotelo=50,
        with_rates=False,
        alias_location=False,
    )

    assert result == {'error': "Не удалось определить IATA-код для 'UnknownCity'"}


@pytest.mark.asyncio
async def test_search_both_merges_sources_and_commits_new_hotels_with_alias(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return 'MOW'

    monkeypatch.setattr(search_both_module, 'AmadeusClient', DummyAmadeus)
    monkeypatch.setattr(search_both_module, '_amadeus_fetch', AsyncMock(return_value=[{'title': 'Alpha Hotel'}]))
    monkeypatch.setattr(search_both_module, '_xotelo_fetch', AsyncMock(return_value=[{'title': 'Beta Hotel'}]))
    fake_db.commit = AsyncMock()

    result = await search_both_module.search_hotels_read_through_both(
        db=fake_db,
        city_input='Moscow',
        check_in='2030-01-10',
        check_out='2030-01-12',
        adults=1,
        providers='both',
        max_hotels_amadeus=100,
        limit_hotels_xotelo=50,
        with_rates=False,
        alias_location=True,
    )

    assert result['city']['code'] == 'MOW'
    assert result['stats']['inserted'] == 2
    assert any(h.title == 'Alpha Hotel' and h.location == 'MOW Moscow' for h in fake_db.hotels_store.values())
    assert any(h.title == 'Beta Hotel' and h.location == 'MOW Moscow' for h in fake_db.hotels_store.values())
    fake_db.commit.assert_awaited_once()
