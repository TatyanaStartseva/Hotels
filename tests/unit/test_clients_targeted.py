from unittest.mock import AsyncMock
import pytest
import httpx

from src.clients.xotelo import XoteloClient
from src.clients.amadeus import AmadeusClient
import src.clients.amadeus as am_mod


class FakeResponse:
    def __init__(self, status_code=200, json_data=None, text=''):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text

    def json(self):
        if isinstance(self._json_data, Exception):
            raise self._json_data
        return self._json_data


@pytest.mark.asyncio
async def test_xotelo_get_json_handles_http_error(monkeypatch):
    client = XoteloClient(api_key='key')

    async def fake_get(url, params):
        raise httpx.HTTPError('network')

    monkeypatch.setattr(client, '_get', fake_get)
    result = await client._get_json('u', {})
    assert result['_error']['status'] == 0


@pytest.mark.asyncio
async def test_xotelo_get_json_handles_451_and_404(monkeypatch):
    client = XoteloClient(api_key='key')

    async def fake_get_451(url, params):
        return FakeResponse(status_code=451)

    monkeypatch.setattr(client, '_get', fake_get_451)
    result = await client._get_json('u', {})
    assert result['_error']['status'] == 451

    async def fake_get_404(url, params):
        return FakeResponse(status_code=404)

    monkeypatch.setattr(client, '_get', fake_get_404)
    result = await client._get_json('u', {})
    assert result['_error']['status'] == 404


@pytest.mark.asyncio
async def test_xotelo_get_json_handles_generic_error_and_bad_json(monkeypatch):
    client = XoteloClient(api_key='key')

    async def fake_get_500(url, params):
        return FakeResponse(status_code=500, json_data={'detail': 'bad'})

    monkeypatch.setattr(client, '_get', fake_get_500)
    result = await client._get_json('u', {})
    assert result['_error']['status'] == 500

    async def fake_get_bad_json(url, params):
        return FakeResponse(status_code=200, json_data=ValueError('bad json'))

    monkeypatch.setattr(client, '_get', fake_get_bad_json)
    result = await client._get_json('u', {})
    assert result['_error']['status'] == 0


@pytest.mark.asyncio
async def test_xotelo_search_fallback_and_success(monkeypatch):
    client = XoteloClient(api_key='key')
    calls = []

    async def fake_get_json(url, params):
        calls.append(url)
        if len(calls) == 1:
            return {'_error': {'status': 404}}
        return {'result': {'items': []}}

    monkeypatch.setattr(client, '_get_json', fake_get_json)
    result = await client.search('Moscow')
    assert 'result' in result
    assert len(calls) == 2


@pytest.mark.asyncio
async def test_xotelo_list_and_rates_return_no_working_endpoint(monkeypatch):
    client = XoteloClient(api_key='key')

    async def fake_get_json(url, params):
        return {'_error': {'status': 404}}

    monkeypatch.setattr(client, '_get_json', fake_get_json)
    list_result = await client.list_hotels('loc')
    rates_result = await client.rates('hk', chk_in='2030-01-01', chk_out='2030-01-02')
    assert list_result['_error']['status'] == 404
    assert rates_result['_error']['status'] == 404


@pytest.mark.asyncio
async def test_amadeus_ensure_token_skips_when_token_fresh():
    client = AmadeusClient(api_key='k', api_secret='s')
    client._token = 'abc'
    client._exp = 10**12
    await client._ensure_token()
    assert client._token == 'abc'


@pytest.mark.asyncio
async def test_amadeus_search_offers_by_city_returns_empty_when_no_ids(monkeypatch):
    client = AmadeusClient(api_key='k', api_secret='s')
    monkeypatch.setattr(client, 'get_hotel_ids_by_city', AsyncMock(return_value=[]))
    result = await client.search_offers_by_city(city_code='MOW', check_in='2030-01-01', check_out='2030-01-02')
    assert result == []


@pytest.mark.asyncio
async def test_amadeus_search_offers_by_city_slices_ids(monkeypatch):
    client = AmadeusClient(api_key='k', api_secret='s')
    monkeypatch.setattr(client, 'get_hotel_ids_by_city', AsyncMock(return_value=['1', '2', '3']))

    async def fake_offers_by_hotel_ids(*, hotel_ids, check_in, check_out, adults):
        return [{'ids': hotel_ids, 'adults': adults}]

    monkeypatch.setattr(client, 'offers_by_hotel_ids', fake_offers_by_hotel_ids)
    result = await client.search_offers_by_city(city_code='MOW', check_in='2030-01-01', check_out='2030-01-02', max_hotels=2)
    assert result == [{'ids': ['1', '2'], 'adults': 1}]


@pytest.mark.asyncio
async def test_amadeus_resolve_city_code_returns_none_for_blank():
    client = AmadeusClient(api_key='k', api_secret='s')
    assert await client.resolve_city_code('   ') is None


@pytest.mark.asyncio
async def test_amadeus_resolve_city_code_returns_cached_value():
    client = AmadeusClient(api_key='k', api_secret='s')
    client._city_cache = {'moscow': ('MOW', 10**12)}
    assert await client.resolve_city_code('Moscow') == 'MOW'
