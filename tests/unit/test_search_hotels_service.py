from types import SimpleNamespace

from unittest.mock import AsyncMock

import pytest

from src.services import search_hotels as search_hotels_module


class EmptyAmadeus:
    async def search_offers_by_city(self, **kwargs):
        return []


class DuplicateOnlyAmadeus:
    async def search_offers_by_city(self, **kwargs):
        return [
            {'hotel': {'name': 'Sochi Grand', 'cityCode': 'AER'}},
            {'hotel': {'name': 'Sochi Grand', 'cityCode': 'AER'}},
        ]


def test_extract_hotels_reads_items_key():
    payload = {'items': [{'id': 1, 'title': 'A', 'location': 'MOW'}]}
    assert search_hotels_module._extract_hotels(payload) == [
        {'id': 1, 'title': 'A', 'location': 'MOW'}
    ]


def test_extract_hotels_returns_empty_for_none_or_empty_dict():
    assert search_hotels_module._extract_hotels(None) == []
    assert search_hotels_module._extract_hotels({}) == []


@pytest.mark.asyncio
async def test_search_hotels_catalog_read_through_does_not_commit_when_provider_returns_empty(fake_db, monkeypatch):
    monkeypatch.setattr(search_hotels_module, 'AmadeusClient', EmptyAmadeus)
    fake_db.commit = AsyncMock()

    result = await search_hotels_module.search_hotels_catalog_read_through(
        fake_db,
        city_code='AER',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['stats']['amadeus_raw'] == 0
    assert result['stats']['inserted'] == 0
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_search_hotels_catalog_read_through_skips_duplicates_and_does_not_commit(fake_db, monkeypatch):
    monkeypatch.setattr(search_hotels_module, 'AmadeusClient', DuplicateOnlyAmadeus)
    fake_db.commit = AsyncMock()

    result = await search_hotels_module.search_hotels_catalog_read_through(
        fake_db,
        city_code='AER',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['stats']['amadeus_raw'] == 2
    assert result['stats']['amadeus_new_candidates'] == 0
    assert result['stats']['inserted'] == 0
    fake_db.commit.assert_not_awaited()

def test_extract_hotels_supports_dicts_and_objects():
    items = [
        {'id': 1, 'title': 'A', 'location': 'MOW'},
        SimpleNamespace(id=2, title='B', location='LED'),
    ]
    result = search_hotels_module._extract_hotels(items)
    assert result == [
        {'id': 1, 'title': 'A', 'location': 'MOW'},
        {'id': 2, 'title': 'B', 'location': 'LED'},
    ]


@pytest.mark.asyncio
async def test_ensure_hotel_returns_false_when_duplicate_exists(fake_db):
    result = await search_hotels_module._ensure_hotel(fake_db, title='Sochi Grand', location='AER')
    assert result is False


@pytest.mark.asyncio
async def test_ensure_hotel_creates_new_hotel(fake_db):
    result = await search_hotels_module._ensure_hotel(fake_db, title='New Hotel', location='KZN')
    assert result is True
    assert any(h.title == 'New Hotel' for h in fake_db.hotels_store.values())


@pytest.mark.asyncio
async def test_search_hotels_catalog_read_through_inserts_only_new_hotels(fake_db, monkeypatch):
    class DummyAmadeus:
        async def search_offers_by_city(self, **kwargs):
            return [
                {'hotel': {'name': 'Sochi Grand', 'cityCode': 'AER'}},
                {'hotel': {'name': 'Sea Breeze', 'cityCode': 'AER'}},
                {'hotel': {'name': 'Sea Breeze', 'cityCode': 'AER'}},
            ]

    monkeypatch.setattr(search_hotels_module, 'AmadeusClient', DummyAmadeus)
    fake_db.commit = AsyncMock()

    result = await search_hotels_module.search_hotels_catalog_read_through(
        fake_db,
        city_code='AER',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['stats']['db_before'] == 1
    assert result['stats']['amadeus_raw'] == 3
    assert result['stats']['amadeus_new_candidates'] == 1
    assert result['stats']['inserted'] == 1
    assert any(item['title'] == 'Sea Breeze' for item in result['final_items'])
    fake_db.commit.assert_awaited_once()
