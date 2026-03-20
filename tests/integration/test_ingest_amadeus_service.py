from unittest.mock import AsyncMock

import pytest

from src.services import ingest_amadeus as ingest_module


@pytest.mark.asyncio
async def test_ingest_hotels_from_amadeus_skips_items_without_name(fake_db, monkeypatch):
    class DummyAmadeus:
        async def search_offers_by_city(self, **kwargs):
            return [
                {'hotel': {'cityCode': 'AER'}},
                {'hotel': {'name': 'Named Hotel', 'cityCode': 'AER'}},
            ]

    fake_db.hotels.get_filtered = AsyncMock(return_value=[])
    fake_db.commit = AsyncMock()
    monkeypatch.setattr(ingest_module, 'AmadeusClient', DummyAmadeus)

    result = await ingest_module.ingest_hotels_from_amadeus(
        fake_db,
        city_code='aer',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['found'] == 2
    assert result['unique'] == 1
    assert result['inserted'] == 1
    fake_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_ingest_hotels_from_amadeus_deduplicates_same_name_and_city(fake_db, monkeypatch):
    class DummyAmadeus:
        async def search_offers_by_city(self, **kwargs):
            return [
                {'hotel': {'name': 'Sea Breeze', 'cityCode': 'AER'}},
                {'hotel': {'name': 'Sea Breeze', 'cityCode': 'AER'}},
            ]

    fake_db.hotels.get_filtered = AsyncMock(return_value=[])
    fake_db.commit = AsyncMock()
    monkeypatch.setattr(ingest_module, 'AmadeusClient', DummyAmadeus)

    result = await ingest_module.ingest_hotels_from_amadeus(
        fake_db,
        city_code='AER',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['found'] == 2
    assert result['unique'] == 1
    assert result['inserted'] == 1


@pytest.mark.asyncio
async def test_ingest_hotels_from_amadeus_does_not_insert_existing_hotels(fake_db, monkeypatch):
    class DummyAmadeus:
        async def search_offers_by_city(self, **kwargs):
            return [
                {'hotel': {'name': 'Sea Breeze', 'cityCode': 'AER'}},
            ]

    fake_db.hotels.get_filtered = AsyncMock(return_value=[{'id': 1}])
    fake_db.hotels.add = AsyncMock()
    fake_db.commit = AsyncMock()
    monkeypatch.setattr(ingest_module, 'AmadeusClient', DummyAmadeus)

    result = await ingest_module.ingest_hotels_from_amadeus(
        fake_db,
        city_code='AER',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert result['inserted'] == 0
    fake_db.hotels.add.assert_not_awaited()
    fake_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_ingest_hotels_from_amadeus_uppercases_city_code_for_client_call(fake_db, monkeypatch):
    dummy = AsyncMock(return_value=[])

    class DummyAmadeus:
        async def search_offers_by_city(self, **kwargs):
            return await dummy(**kwargs)

    fake_db.hotels.get_filtered = AsyncMock(return_value=[])
    fake_db.commit = AsyncMock()
    monkeypatch.setattr(ingest_module, 'AmadeusClient', DummyAmadeus)

    await ingest_module.ingest_hotels_from_amadeus(
        fake_db,
        city_code='aer',
        check_in='2030-01-10',
        check_out='2030-01-12',
    )

    assert dummy.await_args.kwargs['city_code'] == 'AER'
