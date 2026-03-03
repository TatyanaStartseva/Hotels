from fastapi import APIRouter, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.dialects.postgresql import JSONB
import sqlalchemy as sa

from src.api.dependencies import DBDep, UserIdDep
from src.models.rooms import RoomsOrm
from src.models.hotels import HotelsOrm
from src.models.pets import PetsOrm

router = APIRouter(prefix="/rooms", tags=["Поиск номеров"])


def _vacc_names(vaccinations: list | None) -> list[str]:
    if not vaccinations:
        return []
    if all(isinstance(x, str) for x in vaccinations):
        return [x for x in vaccinations if x]
    out: list[str] = []
    for x in vaccinations:
        if isinstance(x, dict) and x.get("name"):
            out.append(x["name"])
    return out


@router.get("/search")
async def rooms_search(
    db: DBDep,
    q: str | None = None,  # город или название

    # фильтры по питомцу
    species: str | None = None,
    temperature_min: float | None = None,
    temperature_max: float | None = None,
    humidity_min: float | None = None,
    humidity_max: float | None = None,
    conditions: str | None = None,  # текст/ключевое слово, ищем в room_conditions

    diet_type: str | None = None,
    feedings_per_day: int | None = None,

    license_required: bool | None = None,
    cohabitation_allowed: bool | None = None,

    vaccinations: list[str] | None = None,  # vaccinations=a&vaccinations=b
):
    stmt = select(RoomsOrm, HotelsOrm).join(HotelsOrm, HotelsOrm.id == RoomsOrm.hotel_id)

    # 1) фильтр по названию/городу (через отель)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                HotelsOrm.title.ilike(like),
                HotelsOrm.location.ilike(like),
                HotelsOrm.title_ru.ilike(like),
                HotelsOrm.location_ru.ilike(like),
            )
        )
    # 2) фильтры по виду
    if species:
        stmt = stmt.where(
            or_(
                RoomsOrm.allowed_species.is_(None),
                RoomsOrm.allowed_species.contains([species]),
            )
        )

    # 3) temp/humidity (NULL = нет ограничения)
    if temperature_min is not None:
        stmt = stmt.where(or_(RoomsOrm.temp_min.is_(None), RoomsOrm.temp_min <= temperature_min))
    if temperature_max is not None:
        stmt = stmt.where(or_(RoomsOrm.temp_max.is_(None), RoomsOrm.temp_max >= temperature_max))

    if humidity_min is not None:
        stmt = stmt.where(or_(RoomsOrm.humidity_min.is_(None), RoomsOrm.humidity_min <= humidity_min))
    if humidity_max is not None:
        stmt = stmt.where(or_(RoomsOrm.humidity_max.is_(None), RoomsOrm.humidity_max >= humidity_max))

    # 4) условия (по тексту)
    if conditions:
        stmt = stmt.where(or_(RoomsOrm.room_conditions.is_(None), RoomsOrm.room_conditions.ilike(f"%{conditions}%")))

    # 5) (опционально) если есть эти колонки в rooms — диета/кормления/лицензия/совместимость/прививки
    # Если у тебя их ещё нет — удали эти блоки.
    if hasattr(RoomsOrm, "diet_supported") and diet_type:
        stmt = stmt.where(or_(RoomsOrm.diet_supported.is_(None), RoomsOrm.diet_supported.contains([diet_type])))

    if hasattr(RoomsOrm, "feedings_per_day_max") and feedings_per_day is not None:
        stmt = stmt.where(or_(RoomsOrm.feedings_per_day_max.is_(None), RoomsOrm.feedings_per_day_max >= feedings_per_day))

    if hasattr(RoomsOrm, "license_required") and license_required is not None:
        if license_required is True:
            # если пользователь требует лицензию — комнаты с license_required=true и false подходят (это требование к документам хозяина),
            # но если ты хочешь искать ТОЛЬКО те, где обязательно — поменяй на stmt.where(RoomsOrm.license_required.is_(True))
            pass
        else:
            stmt = stmt.where(RoomsOrm.license_required.is_(False))

    if hasattr(RoomsOrm, "cohabitation_allowed") and cohabitation_allowed is True:
        stmt = stmt.where(RoomsOrm.cohabitation_allowed.is_(True))

    if hasattr(RoomsOrm, "vaccinations_required") and vaccinations is not None:
        vacc_list = [v.strip() for v in vaccinations if v and v.strip()]
        if vacc_list:
            user_json = sa.cast(sa.literal(vacc_list), JSONB)
            stmt = stmt.where(
                or_(
                    RoomsOrm.vaccinations_required.is_(None),
                    RoomsOrm.vaccinations_required.contained_by(user_json),
                )
            )
        else:
            stmt = stmt.where(RoomsOrm.vaccinations_required.is_(None))

    rows = (await db.session.execute(stmt)).all()

    # 6) ответ: список комнат + вложенный отель
    out = []
    for room, hotel in rows:
        out.append(
            {
                "id": room.id,
                "hotel_id": room.hotel_id,
                "title": room.title,
                "price": room.price,
                "quantity": room.quantity,
                "available": getattr(room, "available", None),
                "hotel": {
                    "id": hotel.id,
                    "title": hotel.title,
                    "location": hotel.location,
                },
            }
        )
    return out