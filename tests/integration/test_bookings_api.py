from datetime import date, timedelta


def test_get_all_bookings(client):
    response = client.get('/bookings')
    assert response.status_code == 200
    assert response.json() == []


def test_get_my_bookings_requires_auth(client):
    response = client.get('/bookings/me')
    assert response.status_code == 401


def test_get_my_bookings_returns_user_bookings(client, auth_headers, fake_db, future_dates):
    start, end = future_dates
    fake_db.bookings_store[1] = type('Booking', (), {'id': 1, 'user_id': 2, 'room_id': 10, 'pet_id': 100, 'date_from': start, 'date_to': end, 'price': 5000})()
    response = client.get('/bookings/me', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_add_booking_success(client, auth_headers, future_dates):
    start, end = future_dates
    response = client.post('/bookings', headers=auth_headers, json={'room_id': 10, 'pet_id': 100, 'date_from': start, 'date_to': end})
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'OK'
    assert body['data']['price'] == 5000


def test_add_booking_rejects_missing_room(client, auth_headers, future_dates):
    start, end = future_dates
    response = client.post('/bookings', headers=auth_headers, json={'room_id': 999, 'pet_id': 100, 'date_from': start, 'date_to': end})
    assert response.status_code == 404
    assert response.json()['detail'] == 'Room not found'


def test_add_booking_rejects_past_dates(client, auth_headers):
    start = (date.today() - timedelta(days=2)).isoformat()
    end = (date.today() + timedelta(days=1)).isoformat()
    response = client.post('/bookings', headers=auth_headers, json={'room_id': 10, 'pet_id': 100, 'date_from': start, 'date_to': end})
    assert response.status_code == 422
    assert 'в прошлом' in response.json()['detail']


def test_add_booking_rejects_wrong_date_order(client, auth_headers, future_dates):
    start, end = future_dates
    response = client.post('/bookings', headers=auth_headers, json={'room_id': 10, 'pet_id': 100, 'date_from': end, 'date_to': start})
    assert response.status_code == 422
    assert 'раньше даты выезда' in response.json()['detail']


def test_add_booking_rejects_user_overlap(client, auth_headers, fake_db, future_dates):
    start, end = future_dates
    fake_db.user_overlap_count = 1
    response = client.post('/bookings', headers=auth_headers, json={'room_id': 10, 'pet_id': 100, 'date_from': start, 'date_to': end})
    assert response.status_code == 409
    assert 'пересекающиеся даты' in response.json()['detail']


def test_add_booking_rejects_when_no_rooms_available(client, auth_headers, fake_db, future_dates):
    start, end = future_dates
    fake_db.booked_count = 2
    response = client.post('/bookings', headers=auth_headers, json={'room_id': 10, 'pet_id': 100, 'date_from': start, 'date_to': end})
    assert response.status_code == 409
    assert 'Нет свободных номеров' in response.json()['detail']
