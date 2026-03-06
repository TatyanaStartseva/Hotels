from unittest.mock import AsyncMock

import pytest


class DummyAmadeus:
    async def resolve_city_code(self, city_raw):
        mapping = {'Sochi': 'AER', 'Moscow': 'MOW'}
        return mapping.get(city_raw)


def test_get_hotels_without_filters(client):
    response = client.get('/hotels')
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_hotels_resolves_city_name(client, monkeypatch):
    monkeypatch.setattr('src.api.hotels.AmadeusClient', DummyAmadeus)
    response = client.get('/hotels', params={'location': 'Sochi'})
    assert response.status_code == 200
    assert response.json()[0]['location'] == 'AER'


def test_get_hotels_bad_city_returns_200(client, monkeypatch):
    monkeypatch.setattr('src.api.hotels.AmadeusClient', DummyAmadeus)
    response = client.get('/hotels', params={'location': 'UnknownCity'})
    assert response.status_code == 200


def test_create_hotel_requires_admin(client, auth_headers):
    response = client.post('/hotels', headers=auth_headers, json={'title': 'Test', 'location': 'AER'})
    assert response.status_code == 403


def test_create_hotel_as_admin(client, admin_headers):
    response = client.post('/hotels', headers=admin_headers, json={'title': 'Test', 'location': 'AER'})
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'ok'
    assert body['saved']['title'] == 'Test'


def test_create_hotel_normalizes_location(client, admin_headers, monkeypatch):
    monkeypatch.setattr('src.api.hotels.AmadeusClient', DummyAmadeus)
    response = client.post('/hotels', headers=admin_headers, json={'title': 'Sochi Test', 'location': 'Sochi'})
    assert response.status_code == 200
    assert response.json()['saved']['location'] == 'AER'


def test_patch_hotel_returns_404_for_missing_record(client, admin_headers):
    response = client.patch('/hotels/999', headers=admin_headers, json={'title': 'Updated'})
    assert response.status_code == 404


def test_delete_hotel_as_admin(client, admin_headers):
    response = client.delete('/hotels/1', headers=admin_headers)
    assert response.status_code == 200


def test_search_hotels_both_rejects_invalid_dates(client):
    response = client.get('/hotels/actions/search', params={'city': 'MOW', 'check_in': 'bad', 'check_out': '2030-01-02'})
    assert response.status_code == 400
    assert response.json()['detail'] == 'Формат дат YYYY-MM-DD'


def test_search_hotels_both_rejects_wrong_range(client):
    response = client.get('/hotels/actions/search', params={'city': 'MOW', 'check_in': '2030-01-05', 'check_out': '2030-01-01'})
    assert response.status_code == 400
    assert 'позже' in response.json()['detail']


def test_get_hotel_by_id_returns_record(client):
    response = client.get('/hotels/1')
    assert response.status_code == 200
    assert response.json()['title'] == 'Sochi Grand'


def test_get_hotels_filters_by_title(client):
    response = client.get('/hotels', params={'title': 'Sochi'})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['title'] == 'Sochi Grand'



def test_patch_hotel_as_admin(client, admin_headers):
    response = client.patch('/hotels/1', headers=admin_headers, json={'title': 'Updated Hotel'})
    assert response.status_code == 200
    assert response.json() == {'status': 'Ok'}


def test_patch_hotel_requires_admin(client, auth_headers):
    response = client.patch('/hotels/1', headers=auth_headers, json={'title': 'Updated Hotel'})
    assert response.status_code == 403


def test_delete_hotel_requires_admin(client, auth_headers):
    response = client.delete('/hotels/1', headers=auth_headers)
    assert response.status_code == 403
