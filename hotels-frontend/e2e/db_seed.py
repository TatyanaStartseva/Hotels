"""Test data helper for Playwright E2E."""

import asyncio
import json
import sys
import uuid
from pathlib import Path

from passlib.context import CryptContext

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from sqlalchemy import text  # noqa: E402
from src.database import async_session_maker  # noqa: E402

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def fix_users_sequence() -> None:
    async with async_session_maker() as session:
        await session.execute(text("""
            SELECT setval(
                pg_get_serial_sequence('users', 'id'),
                COALESCE((SELECT MAX(id) FROM users), 0) + 1,
                false
            )
        """))
        await session.commit()


async def create_admin_user() -> None:
    email = f"admin_{uuid.uuid4().hex[:10]}@test.ru"
    password = "secret123"
    hashed_password = hash_password(password)

    async with async_session_maker() as session:
        await session.execute(
            text("""
                INSERT INTO users (
                    email,
                    hashed_password,
                    is_admin
                )
                VALUES (
                    :email,
                    :hashed_password,
                    true
                )
            """),
            {
                "email": email,
                "hashed_password": hashed_password,
            },
        )

        await session.commit()

    print(json.dumps({
        "email": email,
        "password": password,
    }, ensure_ascii=False))


async def seed_hotel_room(label: str) -> None:
    title = f"E2E Hotel {label}"
    location = "MOW"
    location_ru = "Москва"
    room_title = f"E2E Room {label}"

    async with async_session_maker() as session:
        hotel_id = (await session.execute(
            text("""
                INSERT INTO hotels (title, location, location_ru, title_ru, images)
                VALUES (:title, :location, :location_ru, :title_ru, CAST(:images AS jsonb))
                RETURNING id
            """),
            {
                "title": title,
                "location": location,
                "location_ru": location_ru,
                "title_ru": title,
                "images": "[]",
            },
        )).scalar_one()

        room_id = (await session.execute(
            text("""
                INSERT INTO rooms (
                    hotel_id, title, description, price, quantity,
                    allowed_species, temp_min, temp_max, humidity_min, humidity_max,
                    room_conditions, vaccinations_required, chip_required,
                    diet_supported, feedings_per_day_max,
                    license_required, cohabitation_allowed
                )
                VALUES (
                    :hotel_id, :room_title, :description, :price, :quantity,
                    CAST(:allowed_species AS jsonb), :temp_min, :temp_max, :humidity_min, :humidity_max,
                    :room_conditions, CAST(:vaccinations_required AS jsonb), :chip_required,
                    CAST(:diet_supported AS jsonb), :feedings_per_day_max,
                    :license_required, :cohabitation_allowed
                )
                RETURNING id
            """),
            {
                "hotel_id": hotel_id,
                "room_title": room_title,
                "description": "Тестовая комната для кошек и собак",
                "price": 3000,
                "quantity": 2,
                "allowed_species": json.dumps(["cat", "dog"]),
                "temp_min": 18,
                "temp_max": 28,
                "humidity_min": 35,
                "humidity_max": 65,
                "room_conditions": "тихо, без сквозняков, стандарт",
                "vaccinations_required": json.dumps(["rabies", "complex"]),
                "chip_required": False,
                "diet_supported": json.dumps(["dry", "natural"]),
                "feedings_per_day_max": 3,
                "license_required": False,
                "cohabitation_allowed": True,
            },
        )).scalar_one()

        await session.commit()

    print(json.dumps({
        "hotel_id": hotel_id,
        "room_id": room_id,
        "hotel_title": title,
        "room_title": room_title,
        "location": location,
        "location_ru": location_ru,
    }, ensure_ascii=False))


async def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python e2e/db_seed.py <command>")

    command = sys.argv[1]

    if command == "seed_hotel_room":
        if len(sys.argv) != 3:
            raise SystemExit("Usage: python e2e/db_seed.py seed_hotel_room E2E_LABEL")
        await seed_hotel_room(sys.argv[2])
        return

    if command == "fix_users_sequence":
        await fix_users_sequence()
        return

    if command == "create_admin_user":
        await create_admin_user()
        return

    raise SystemExit(f"Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main())