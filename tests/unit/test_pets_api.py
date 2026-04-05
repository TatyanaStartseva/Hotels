import pytest
def test_get_my_pets_requires_auth(client):
    response = client.get('/pets/me')
    assert response.status_code == 401


def test_get_my_pets_success(client, auth_headers):
    response = client.get('/pets/me', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_create_pet_success(client, auth_headers):
    response = client.post(
        '/pets',
        headers=auth_headers,
        json={
            'name': 'Рекс',
            'conditions': 'quiet',
            'diet_type': 'dry',
            'feedings_per_day': 2,
        },
    )
    assert response.status_code == 200
    assert response.json()['status'] == 'OK'


def test_create_pet_rejects_invalid_temperature_range(client, auth_headers):
    response = client.post('/pets', headers=auth_headers, json={'temperature_min': 30, 'temperature_max': 10})
    assert response.status_code == 422
    assert 'temperature_min > temperature_max' in response.json()['detail']


def test_create_pet_rejects_invalid_humidity_range(client, auth_headers):
    response = client.post('/pets', headers=auth_headers, json={'humidity_min': 70, 'humidity_max': 20})
    assert response.status_code == 422
    assert 'humidity_min > humidity_max' in response.json()['detail']




@pytest.mark.parametrize("feedings_per_day", [0, -1])
def test_create_pet_rejects_feedings_less_than_one(client, auth_headers, feedings_per_day):
    response = client.post(
        "/pets",
        headers=auth_headers,
        json={
            "name": "Барсик",
            "feedings_per_day": feedings_per_day,
        },
    )

    assert response.status_code == 422
    assert "feedings_per_day" in str(response.json()["detail"])


def test_create_pet_accepts_feedings_equal_one(client, auth_headers):
    response = client.post(
        "/pets",
        headers=auth_headers,
        json={
            "name": "Барсик",
            "feedings_per_day": 1,
        },
    )

    assert response.status_code in (200, 201)


def test_create_pet_rejects_missing_license_number(client, auth_headers):
    response = client.post('/pets', headers=auth_headers, json={'license_required': True})
    assert response.status_code == 422
    assert 'license_number is required' in response.json()['detail']


def test_update_pet_success(client, auth_headers):
    response = client.patch('/pets/100', headers=auth_headers, json={'diet_type': 'natural'})
    assert response.status_code == 200
    assert response.json()['status'] == 'OK'


def test_update_pet_returns_404_for_foreign_pet(client, auth_headers):
    response = client.patch('/pets/999', headers=auth_headers, json={'diet_type': 'natural'})
    assert response.status_code == 404


def test_delete_pet_success(client, auth_headers):
    response = client.delete('/pets/100', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['status'] == 'OK'


def test_update_pet_requires_auth(client):
    response = client.patch('/pets/100', json={'diet_type': 'natural'})
    assert response.status_code == 401


def test_delete_pet_requires_auth(client):
    response = client.delete('/pets/100')
    assert response.status_code == 401


def test_create_pet_persists_for_current_user(client, auth_headers, fake_db):
    response = client.post(
        '/pets',
        headers=auth_headers,
        json={
            'name': 'Барсик',
            'conditions': 'warm',
            'diet_type': 'natural',
            'feedings_per_day': 3,
        },
    )
    assert response.status_code == 200
    created_id = response.json()['data']['id']
    assert fake_db.pets_store[created_id].user_id == 2
    assert fake_db.pets_store[created_id].name == 'Барсик'
