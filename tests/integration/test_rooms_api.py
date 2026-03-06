
def test_get_rooms_for_hotel(client):
    response = client.get('/rooms/1/rooms')
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_rooms_with_dates_uses_availability(client, future_dates):
    date_from, date_to = future_dates
    response = client.get('/rooms/1/rooms', params={'date_from': date_from, 'date_to': date_to})
    assert response.status_code == 200
    assert 'available' in response.json()[0]


def test_get_single_room(client):
    response = client.get('/rooms/1/rooms/10')
    assert response.status_code == 200
    assert response.json()['title'] == 'Стандарт'


def test_create_room_as_admin(client, admin_headers):
    response = client.post('/rooms/1/rooms', headers=admin_headers, json={'title': 'Эконом', 'price': 3000, 'quantity': 3})
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_create_room_requires_admin(client, auth_headers):
    response = client.post('/rooms/1/rooms', headers=auth_headers, json={'title': 'Эконом', 'price': 3000, 'quantity': 3})
    assert response.status_code == 403


def test_patch_room_as_admin(client, admin_headers):
    response = client.patch('/rooms/1/rooms/10', headers=admin_headers, json={'title': 'Супер стандарт'})
    assert response.status_code == 200
    assert response.json() == {'status': 'Ok'}


def test_patch_room_returns_404_when_missing(client, admin_headers):
    response = client.patch('/rooms/1/rooms/999', headers=admin_headers, json={'title': 'x'})
    assert response.status_code == 404
    assert response.json()['detail'] == 'Room not found'


def test_delete_room_as_admin(client, admin_headers):
    response = client.delete('/rooms/1/rooms/10', headers=admin_headers)
    assert response.status_code == 200



def test_get_rooms_for_unknown_hotel_returns_empty_list(client):
    response = client.get('/rooms/999/rooms')
    assert response.status_code == 200
    assert response.json() == []


def test_get_single_room_for_unknown_hotel_returns_null(client):
    response = client.get('/rooms/999/rooms/10')
    assert response.status_code == 200
    assert response.json() is None


def test_patch_room_requires_admin(client, auth_headers):
    response = client.patch('/rooms/1/rooms/10', headers=auth_headers, json={'title': 'Blocked'})
    assert response.status_code == 403


def test_delete_room_requires_admin(client, auth_headers):
    response = client.delete('/rooms/1/rooms/10', headers=auth_headers)
    assert response.status_code == 403
