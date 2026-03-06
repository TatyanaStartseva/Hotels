from types import SimpleNamespace

import pytest

from src.schemas.bookings import Booking, BookingAdd, BookingAddRequest
from src.schemas.hotels import HotelAdd, HotelPatch
from src.schemas.rooms import PatchRoom, PatchRoomRequest, Room, RoomAdd, RoomAddRequest
from src.schemas.users import User, UserAdd, UserRequestAdd, UserWithHashedPassword


@pytest.mark.parametrize(
    ('payload', 'expected_images'),
    [
        ({'title': 'Alpha', 'location': 'MOW'}, []),
        ({'title': 'Beta', 'location': 'LED', 'images': ['a.jpg']}, ['a.jpg']),
        ({'title': 'Gamma', 'location': 'AER', 'images': []}, []),
    ],
)
def test_hotel_add_images_cases(payload, expected_images):
    model = HotelAdd(**payload)
    assert model.images == expected_images


@pytest.mark.parametrize(
    ('payload', 'expected_title', 'expected_location', 'expected_images'),
    [
        ({}, None, None, None),
        ({'title': 'Only title'}, 'Only title', None, None),
        ({'location': 'MOW'}, None, 'MOW', None),
        ({'images': ['x.png']}, None, None, ['x.png']),
    ],
)
def test_hotel_patch_cases(payload, expected_title, expected_location, expected_images):
    model = HotelPatch(**payload)
    assert model.title == expected_title
    assert model.location == expected_location
    assert model.images == expected_images


@pytest.mark.parametrize(
    'email',
    [
        'user@example.com',
        'user.name+tag@example.org',
        'simple@test.ru',
        'abc123@domain.net',
    ],
)
def test_user_request_add_accepts_emails(email):
    model = UserRequestAdd(email=email, password='secret123')
    assert str(model.email) == email


@pytest.mark.parametrize(
    ('payload', 'expected_admin'),
    [
        ({'email': 'a@example.com', 'hashed_password': 'h1'}, False),
        ({'email': 'b@example.com', 'hashed_password': 'h2', 'is_admin': True}, True),
        ({'email': 'c@example.com', 'hashed_password': 'h3', 'is_admin': False}, False),
    ],
)
def test_user_add_is_admin_cases(payload, expected_admin):
    model = UserAdd(**payload)
    assert model.is_admin is expected_admin


@pytest.mark.parametrize(
    ('source', 'expected_admin'),
    [
        (SimpleNamespace(id=1, email='admin@example.com', is_admin=True), True),
        (SimpleNamespace(id=2, email='user@example.com', is_admin=False), False),
    ],
)
def test_user_model_validate_from_attributes_cases(source, expected_admin):
    model = User.model_validate(source, from_attributes=True)
    assert model.id == source.id
    assert str(model.email) == source.email
    assert model.is_admin is expected_admin


def test_user_with_hashed_password_keeps_hash_field():
    model = UserWithHashedPassword(id=10, email='hash@example.com', is_admin=False, hashed_password='abc')
    assert model.hashed_password == 'abc'


@pytest.mark.parametrize(
    ('payload', 'room_id', 'pet_id'),
    [
        ({'room_id': 1, 'pet_id': 10, 'date_from': '2030-01-01', 'date_to': '2030-01-02'}, 1, 10),
        ({'room_id': 2, 'pet_id': 11, 'date_from': '2031-02-03', 'date_to': '2031-02-05'}, 2, 11),
        ({'room_id': 9, 'pet_id': 99, 'date_from': '2040-12-10', 'date_to': '2040-12-20'}, 9, 99),
    ],
)
def test_booking_add_request_cases(payload, room_id, pet_id):
    model = BookingAddRequest(**payload)
    assert model.room_id == room_id
    assert model.pet_id == pet_id


@pytest.mark.parametrize(
    ('payload', 'expected_price'),
    [
        ({'user_id': 1, 'room_id': 2, 'pet_id': 3, 'date_from': '2030-01-01', 'date_to': '2030-01-03', 'price': 5000}, 5000),
        ({'user_id': 2, 'room_id': 4, 'pet_id': 5, 'date_from': '2030-02-01', 'date_to': '2030-02-02', 'price': 7000}, 7000),
        ({'user_id': 3, 'room_id': 6, 'pet_id': 7, 'date_from': '2030-03-05', 'date_to': '2030-03-08', 'price': 9000}, 9000),
    ],
)
def test_booking_add_cases(payload, expected_price):
    model = BookingAdd(**payload)
    assert model.price == expected_price
    assert model.model_dump()['price'] == expected_price


@pytest.mark.parametrize(
    ('payload', 'expected_desc'),
    [
        ({'title': 'Стандарт', 'price': 1000, 'quantity': 2}, None),
        ({'title': 'Люкс', 'description': 'вид на море', 'price': 3000, 'quantity': 1}, 'вид на море'),
        ({'title': 'Семейный', 'description': '', 'price': 2500, 'quantity': 4}, ''),
    ],
)
def test_room_add_request_cases(payload, expected_desc):
    model = RoomAddRequest(**payload)
    assert model.description == expected_desc


@pytest.mark.parametrize(
    ('payload', 'expected_available'),
    [
        ({'hotel_id': 1, 'title': 'Стандарт', 'price': 1000, 'quantity': 2}, None),
        ({'hotel_id': 1, 'title': 'Люкс', 'price': 2000, 'quantity': 1, 'available': 1}, 1),
        ({'hotel_id': 2, 'title': 'VIP', 'price': 3000, 'quantity': 3, 'available': 0}, 0),
    ],
)
def test_room_add_cases(payload, expected_available):
    model = RoomAdd(**payload)
    assert model.available == expected_available


@pytest.mark.parametrize(
    ('payload', 'expected_title'),
    [
        ({'title': 'Номер A'}, 'Номер A'),
        ({'price': 1234}, None),
        ({'hotel_id': 5, 'quantity': 10}, None),
    ],
)
def test_patch_room_request_cases(payload, expected_title):
    model = PatchRoomRequest(**payload)
    assert model.title == expected_title


@pytest.mark.parametrize(
    ('payload', 'expected_hotel_id'),
    [
        ({}, None),
        ({'hotel_id': 1, 'title': 'X'}, 1),
        ({'hotel_id': None, 'price': 500}, None),
    ],
)
def test_patch_room_cases(payload, expected_hotel_id):
    model = PatchRoom(**payload)
    assert model.hotel_id == expected_hotel_id


@pytest.mark.parametrize(
    ('source', 'expected_id'),
    [
        (SimpleNamespace(id=1, hotel_id=10, title='A', description=None, price=100, quantity=2, available=1), 1),
        (SimpleNamespace(id=2, hotel_id=11, title='B', description='desc', price=200, quantity=3, available=0), 2),
    ],
)
def test_room_model_validate_from_attributes_cases(source, expected_id):
    model = Room.model_validate(source, from_attributes=True)
    assert model.id == expected_id
    assert model.hotel_id == source.hotel_id


@pytest.mark.parametrize(
    ('source', 'expected_id'),
    [
        (SimpleNamespace(id=7, user_id=1, room_id=2, pet_id=3, date_from='2030-01-01', date_to='2030-01-03', price=900), 7),
        (SimpleNamespace(id=8, user_id=2, room_id=4, pet_id=5, date_from='2030-02-01', date_to='2030-02-02', price=1200), 8),
    ],
)
def test_booking_model_validate_from_attributes_cases(source, expected_id):
    model = Booking.model_validate(source, from_attributes=True)
    assert model.id == expected_id
    assert model.price == source.price
