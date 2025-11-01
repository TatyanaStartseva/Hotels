# src/services/search_hotels.py
from datetime import datetime
from typing import Any
from src.clients.amadeus import AmadeusClient
from src.utils.db_manager import DBManager
from src.schemas.hotels import HotelAdd

def _extract_hotels(items: Any) -> list[dict]:
    # универсально достаём объекты отелей (dict/ORM/Pydantic)
    print(items)
    print("-------------------------------------------------------------")
    if not items:
        return []
    if isinstance(items, dict) and "items" in items:
        items = items["items"]
    out = []
    for h in items:
        if isinstance(h, dict):
            out.append(h)
        else:
            out.append({"id": getattr(h, "id", None),
                        "title": getattr(h, "title", None),
                        "location": getattr(h, "location", None)})
    return out

async def _ensure_hotel(db: DBManager, *, title: str, location: str) -> bool:
    """Возвращает True если создали новый отель. Работает через твои get_all/add."""
    existing = await db.hotels.get_all(title=title, location=location, id=None, limit=1, offset=0)
    ex = _extract_hotels(existing)
    if ex:
        return False
    await db.hotels.add(HotelAdd(title=title, location=location))
    return True

# src/services/search_hotels.py

async def search_hotels_catalog_read_through(
    db: DBManager, *, city_code: str, check_in: str, check_out: str
):
    """
    Совместный ответ: что уже было в БД, что нашли в Amadeus и добавили,
    и финальный список из БД после пополнения.
    """
    # 1) Что уже было в БД
    db_before_raw = await db.hotels.get_all(location=city_code, title=None, id=None, limit=2000, offset=0)
    db_before = _extract_hotels(db_before_raw)

    # Ключи существующих отелей для дедупликации (нормализуем по (title, location))
    existing_keys = {
        ((h.get("title") or "").strip().lower(), (h.get("location") or "").strip().upper())
        for h in db_before
    }

    # 2) Тянем из Amadeus и готовим список НОВЫХ отелей (которые ещё не в БД)
    am = AmadeusClient()
    raw = await am.search_offers_by_city(
        city_code=city_code, check_in=check_in, check_out=check_out, adults=1
    )

    amadeus_candidates: list[dict] = []
    seen_new_keys: set[tuple[str, str]] = set()

    for item in raw or []:
        hotel = item.get("hotel") or {}
        name = (hotel.get("name") or "").strip()
        code = (hotel.get("cityCode") or city_code).strip().upper()
        if not name:
            continue

        key = (name.lower(), code)
        if key in existing_keys or key in seen_new_keys:
            continue

        amadeus_candidates.append({"title": name, "location": code})
        seen_new_keys.add(key)

    # 3) Добавляем НОВЫЕ отели в БД
    created = 0
    for cand in amadeus_candidates:
        if await _ensure_hotel(db, title=cand["title"], location=cand["location"]):
            created += 1

    if created:
        await db.commit()

    # 4) Повторно читаем БД — финальный список
    db_after_raw = await db.hotels.get_all(location=city_code, title=None, id=None, limit=2000, offset=0)
    db_after = _extract_hotels(db_after_raw)

    # 5) Формируем совместный ответ
    return {
        "city": {"code": city_code},
        "stats": {
            "db_before": len(db_before),
            "amadeus_raw": len(raw or []),
            "amadeus_new_candidates": len(amadeus_candidates),  # уникальные к БД
            "inserted": created,
            "db_after": len(db_after),
        },
        # что было в БД ДО
        "db_items_before": db_before,
        # какие НОВЫЕ мы нашли в Amadeus и пытались вставить
        "amadeus_new": amadeus_candidates,
        # финальный список из БД ПОСЛЕ вставки (источник истины)
        "final_items": db_after,
    }

