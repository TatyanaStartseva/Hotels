import os
from dataclasses import dataclass
from datetime import date, timedelta
from types import SimpleNamespace
from typing import Any, Dict, List, Optional

import pytest
from fastapi.testclient import TestClient

# Конфиг проекта читает env при импорте, поэтому выставляем переменные заранее.
os.environ.setdefault('DB_NAME', 'test_db')
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('DB_PORT', '5432')
os.environ.setdefault('DB_USER', 'postgres')
os.environ.setdefault('DB_PASS', 'postgres')
os.environ.setdefault('AMADEUS_KEY', 'test')
os.environ.setdefault('AMADEUS_SECRET', 'test')
os.environ.setdefault('OFFERS_TTL_MINUTES', '30')
os.environ.setdefault('XOTELO_RAPIDAPI_KEY', 'test')
os.environ.setdefault('XOTELO_RAPIDAPI_HOST', 'test')
os.environ.setdefault('JWT_SECRET_KEY', 'super-secret-test-key')
os.environ.setdefault('JWT_ALGORITHM', 'HS256')
os.environ.setdefault('ACCESS_TOKEN_EXPIRE_MINUTES', '120')

from src.main import app
from src.api.dependencies import get_db
from src.services.auth import AuthService


class FakeResult:
    def __init__(self, value: Any = None, rows: Optional[list] = None):
        self._value = value
        self._rows = rows or []

    def scalar_one(self):
        return self._value

    def all(self):
        return self._rows


class FakeSession:
    def __init__(self, db: 'FakeDBManager'):
        self.db = db

    async def execute(self, query):
        # Для бронирований проект считает count(BookingsOrm.id), поэтому нам достаточно
        # вернуть нужные числа по текущему сценарию.
        text = str(query)
        if 'count(bookings.id)' in text.lower():
            if 'bookings.user_id' in text.lower():
                return FakeResult(self.db.user_overlap_count)
            return FakeResult(self.db.booked_count)
        return FakeResult(rows=self.db.session_rows)


class FakeUsersRepo:
    def __init__(self, db: 'FakeDBManager'):
        self.db = db

    async def add(self, data):
        if any(u.email == data.email for u in self.db.users_store.values()):
            from sqlalchemy.exc import IntegrityError
            raise IntegrityError('duplicate', params=None, orig=None)
        new_id = max(self.db.users_store.keys() or [0]) + 1
        user = SimpleNamespace(id=new_id, email=str(data.email), hashed_password=data.hashed_password, is_admin=getattr(data, 'is_admin', False))
        self.db.users_store[new_id] = user
        return user

    async def get_user_with_hashed_password(self, email):
        for user in self.db.users_store.values():
            if user.email == str(email):
                return user
        return None

    async def get_one_or_none(self, **filter_by):
        if 'id' in filter_by:
            return self.db.users_store.get(filter_by['id'])
        return None


class FakeHotelsRepo:
    def __init__(self, db: 'FakeDBManager'):
        self.db = db

    async def get_all(
        self,
        id=None,
        location=None,
        location_variants=None,
        title=None,
        limit=10,
        offset=0,
    ):
        items = list(self.db.hotels_store.values())

        if id is not None:
            items = [h for h in items if h.id == id]

        if title:
            items = [h for h in items if title.lower() in h.title.lower()]

        effective_locations = []
        if location_variants:
            effective_locations = [x.lower() for x in location_variants if x]
        elif location:
            effective_locations = [location.lower()]

        if effective_locations:
            filtered = []
            for h in items:
                loc = (getattr(h, "location", "") or "").lower()
                loc_ru = (getattr(h, "location_ru", "") or "").lower()
                if any(v in loc or v in loc_ru for v in effective_locations):
                    filtered.append(h)
            items = filtered

        return items[offset: offset + limit]

    async def add(self, data):
        new_id = max(self.db.hotels_store.keys() or [0]) + 1
        hotel = SimpleNamespace(
            id=new_id,
            title=data.title,
            location=data.location,
            location_ru=getattr(data, "location_ru", None),
            images=getattr(data, "images", []),
        )
        self.db.hotels_store[new_id] = hotel
        return hotel

    async def edit(self, data, exclude_unset=False, **filter_by):
        hotel = self.db.hotels_store.get(filter_by.get('id'))
        if not hotel:
            return {'status': 'error'}
        payload = data.model_dump(exclude_unset=exclude_unset)
        for key, value in payload.items():
            setattr(hotel, key, value)
        return {'status': 'success'}

    async def delete(self, **filter_by):
        hotel = self.db.hotels_store.pop(filter_by.get('id'), None)
        return hotel or {'status': 'error'}

    async def get_hotel(self, hotel_id):
        return self.db.hotels_store.get(hotel_id)


class FakeRoomsRepo:
    def __init__(self, db: 'FakeDBManager'):
        self.db = db

    async def get_filtered(self, **filter_by):
        items = list(self.db.rooms_store.values())
        for key, value in filter_by.items():
            items = [r for r in items if getattr(r, key) == value]
        return items

    async def get_one_or_none(self, **filter_by):
        for room in self.db.rooms_store.values():
            if all(getattr(room, k) == v for k, v in filter_by.items()):
                return room
        return None

    async def add(self, data):
        new_id = max(self.db.rooms_store.keys() or [0]) + 1
        room = SimpleNamespace(id=new_id, **data.model_dump())
        self.db.rooms_store[new_id] = room
        return room

    async def edit(self, data, exclude_unset=False, **filter_by):
        room = await self.get_one_or_none(id=filter_by.get('id'), hotel_id=filter_by.get('hotel_id', filter_by.get('hotel_id')))
        if not room:
            return {'status': 'error'}
        for key, value in data.model_dump(exclude_unset=exclude_unset).items():
            setattr(room, key, value)
        return {'status': 'success'}

    async def delete(self, **filter_by):
        room = await self.get_one_or_none(id=filter_by.get('id'), hotel_id=filter_by.get('hotel_id'))
        if not room:
            return {'status': 'error'}
        self.db.rooms_store.pop(room.id, None)
        return room

    async def get_with_availability(self, hotel_id, date_from, date_to):
        rooms = [r for r in self.db.rooms_store.values() if r.hotel_id == hotel_id]
        return [
            {
                'id': r.id,
                'title': r.title,
                'price': r.price,
                'quantity': r.quantity,
                'available': max(0, r.quantity - self.db.booked_count),
            }
            for r in rooms
        ]


class FakeBookingsRepo:
    def __init__(self, db: 'FakeDBManager'):
        self.db = db

    async def get_all(self):
        return list(self.db.bookings_store.values())

    async def get_filtered(self, **filter_by):
        items = list(self.db.bookings_store.values())
        for key, value in filter_by.items():
            items = [b for b in items if getattr(b, key) == value]
        return items

    async def add(self, data):
        new_id = max(self.db.bookings_store.keys() or [0]) + 1
        booking = SimpleNamespace(id=new_id, **data.model_dump())
        self.db.bookings_store[new_id] = booking
        return booking


class FakePetsRepo:
    def __init__(self, db: 'FakeDBManager'):
        self.db = db

    async def get_filtered(self, **filter_by):
        items = list(self.db.pets_store.values())
        for key, value in filter_by.items():
            items = [p for p in items if getattr(p, key) == value]
        return items

    async def add(self, data):
        new_id = max(self.db.pets_store.keys() or [0]) + 1
        pet = SimpleNamespace(id=new_id, **data.model_dump())
        self.db.pets_store[new_id] = pet
        return pet

    async def get_one_or_none(self, **filter_by):
        for pet in self.db.pets_store.values():
            if all(getattr(pet, k) == v for k, v in filter_by.items()):
                return pet
        return None

    async def edit(self, data, exclude_unset=False, **filter_by):
        pet = await self.get_one_or_none(id=filter_by.get('id'))
        if not pet:
            return {'status': 'error'}
        for key, value in data.model_dump(exclude_unset=exclude_unset).items():
            setattr(pet, key, value)
        return {'status': 'success'}

    async def delete(self, **filter_by):
        pet = await self.get_one_or_none(id=filter_by.get('id'))
        if not pet:
            return {'status': 'error'}
        self.db.pets_store.pop(pet.id, None)
        return pet


@dataclass
class FakeDBManager:
    users_store: Dict[int, Any]
    hotels_store: Dict[int, Any]
    rooms_store: Dict[int, Any]
    bookings_store: Dict[int, Any]
    pets_store: Dict[int, Any]
    user_overlap_count: int = 0
    booked_count: int = 0
    session_rows: Optional[list] = None
    committed: bool = False
    rolled_back: bool = False

    def __post_init__(self):
        self.users = FakeUsersRepo(self)
        self.hotels = FakeHotelsRepo(self)
        self.rooms = FakeRoomsRepo(self)
        self.bookings = FakeBookingsRepo(self)
        self.pets = FakePetsRepo(self)
        self.session = FakeSession(self)
        self.session_rows = self.session_rows or []

    async def commit(self):
        self.committed = True

    async def rollback(self):
        self.rolled_back = True


@pytest.fixture
def fake_db():
    auth = AuthService()
    return FakeDBManager(
        users_store={
            1: SimpleNamespace(id=1, email='admin@example.com', hashed_password=auth.hash_password('adminpass'), is_admin=True),
            2: SimpleNamespace(id=2, email='user@example.com', hashed_password=auth.hash_password('userpass'), is_admin=False),
        },
        hotels_store={
            1: SimpleNamespace(id=1, title='Sochi Grand', location='AER', images=[]),
            2: SimpleNamespace(id=2, title='Moscow Plaza', location='MOW', images=[]),
        },
        rooms_store={
            10: SimpleNamespace(id=10, hotel_id=1, title='Стандарт', description='...', price=5000, quantity=2),
            11: SimpleNamespace(id=11, hotel_id=1, title='Люкс', description='...', price=9000, quantity=1),
        },
        bookings_store={},
        pets_store={
            100: SimpleNamespace(id=100, user_id=2, conditions='quiet', diet_type='dry', feedings_per_day=2, license_required=False, cohabitation_allowed=True),
        },
    )


@pytest.fixture
def client(fake_db):
    async def override_get_db():
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_service():
    return AuthService()


@pytest.fixture
def user_token(auth_service):
    return auth_service.create_access_token({'user_id': 2})


@pytest.fixture
def admin_token(auth_service):
    return auth_service.create_access_token({'user_id': 1})


@pytest.fixture
def auth_headers(user_token):
    return {'Authorization': f'Bearer {user_token}'}


@pytest.fixture
def admin_headers(admin_token):
    return {'Authorization': f'Bearer {admin_token}'}


@pytest.fixture
def future_dates():
    start = date.today() + timedelta(days=5)
    end = start + timedelta(days=3)
    return start.isoformat(), end.isoformat()
