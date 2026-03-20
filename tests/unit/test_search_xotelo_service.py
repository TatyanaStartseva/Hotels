from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from src.services import search_xotelo as search_xotelo_module


def test_extract_hotels_supports_dict_with_items_key():
    payload = {'items': [{'id': 1, 'title': 'Hotel A', 'location': 'AER'}]}
    assert search_xotelo_module._extract_hotels(payload) == [
        {'id': 1, 'title': 'Hotel A', 'location': 'AER'}
    ]


def test_extract_hotels_supports_object_items():
    payload = [SimpleNamespace(id=2, title='Hotel B', location='MOW')]
    assert search_xotelo_module._extract_hotels(payload) == [
        {'id': 2, 'title': 'Hotel B', 'location': 'MOW'}
    ]


@pytest.mark.asyncio
async def test_ensure_hotel_returns_false_for_existing_item(fake_db):
    result = await search_xotelo_module._ensure_hotel(fake_db, title='Sochi Grand', location='AER')
    assert result is False


@pytest.mark.asyncio
async def test_ensure_hotel_adds_new_item(fake_db):
    result = await search_xotelo_module._ensure_hotel(fake_db, title='Wave Resort', location='AER')
    assert result is True
    assert any(h.title == 'Wave Resort' for h in fake_db.hotels_store.values())


@pytest.mark.asyncio
async def test_search_hotels_xotelo_returns_error_when_city_code_unresolved(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return None

    monkeypatch.setattr(search_xotelo_module, 'AmadeusClient', DummyAmadeus)

    result = await search_xotelo_module.search_hotels_xotelo_read_through(
        fake_db,
        city_input='Unknown City',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert 'Не удалось определить IATA-код' in result['error']


@pytest.mark.asyncio
async def test_search_hotels_xotelo_returns_db_only_when_location_key_missing(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return 'AER'

    class DummyXotelo:
        async def search(self, city_input):
            return {'result': {'list': [{'name': 'No key here'}]}}

    monkeypatch.setattr(search_xotelo_module, 'AmadeusClient', DummyAmadeus)
    monkeypatch.setattr(search_xotelo_module, 'XoteloClient', DummyXotelo)

    result = await search_xotelo_module.search_hotels_xotelo_read_through(
        fake_db,
        city_input='Sochi',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['stats']['xotelo_found'] == 0
    assert result['stats']['inserted'] == 0
    assert result['final_items'] == result['db_items_before']


@pytest.mark.asyncio
async def test_search_hotels_xotelo_inserts_only_new_hotels_and_commits(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return 'AER'

    class DummyXotelo:
        async def search(self, city_input):
            return {'result': {'list': [{'location_key': 'loc-1'}]}}

        async def list_hotels(self, location_key, limit, offset):
            return {
                'result': {
                    'hotels': [
                        {'name': 'Sochi Grand', 'hotel_key': 'dup'},
                        {'name': 'Wave Resort', 'hotel_key': 'new-1'},
                        {'name': 'Wave Resort', 'hotel_key': 'new-1'},
                    ]
                }
            }

    fake_db.commit = AsyncMock()
    monkeypatch.setattr(search_xotelo_module, 'AmadeusClient', DummyAmadeus)
    monkeypatch.setattr(search_xotelo_module, 'XoteloClient', DummyXotelo)

    result = await search_xotelo_module.search_hotels_xotelo_read_through(
        fake_db,
        city_input='Sochi',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['stats']['db_before'] == 1
    assert result['stats']['xotelo_found'] == 3
    assert result['stats']['inserted'] == 1
    assert any(item['title'] == 'Wave Resort' for item in result['final_items'])
    fake_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_search_hotels_xotelo_uses_alias_location_when_requested(fake_db, monkeypatch):
    class DummyAmadeus:
        async def resolve_city_code(self, city_input):
            return 'AER'

    class DummyXotelo:
        async def search(self, city_input):
            return {'result': {'list': [{'location_key': 'loc-1'}]}}

        async def list_hotels(self, location_key, limit, offset):
            return {'result': {'hotels': [{'name': 'Alias Hotel', 'hotel_key': 'h1'}]}}

    monkeypatch.setattr(search_xotelo_module, 'AmadeusClient', DummyAmadeus)
    monkeypatch.setattr(search_xotelo_module, 'XoteloClient', DummyXotelo)

    await search_xotelo_module.search_hotels_xotelo_read_through(
        fake_db,
        city_input='Sochi',
        check_in='2030-01-10',
        check_out='2030-01-12',
        alias_location=True,
    )

    inserted = next(h for h in fake_db.hotels_store.values() if h.title == 'Alias Hotel')
    assert inserted.location == 'AER Sochi'
