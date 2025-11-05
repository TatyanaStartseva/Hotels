# src/services/search_xotelo.py
from __future__ import annotations
from typing import Any, Dict, List, Tuple
import asyncio

from src.clients.xotelo import XoteloClient
from src.clients.amadeus import AmadeusClient
from src.utils.db_manager import DBManager
from src.schemas.hotels import HotelAdd

def _extract_hotels(items: Any) -> list[dict]:
    if not items:
        return []
    if isinstance(items, dict) and "items" in items:
        items = items["items"]
    out: list[dict] = []
    for h in items:
        if isinstance(h, dict):
            out.append(h)
        else:
            out.append({
                "id": getattr(h, "id", None),
                "title": getattr(h, "title", None),
                "location": getattr(h, "location", None),
            })
    return out

async def _ensure_hotel(db: DBManager, *, title: str, location: str) -> bool:
    existing = await db.hotels.get_all(title=title, location=location, id=None, limit=1, offset=0)
    if _extract_hotels(existing):
        return False
    await db.hotels.add(HotelAdd(title=title, location=location))
    return True

async def search_hotels_xotelo_read_through(
    db: DBManager,
    *,
    city_input: str,
    check_in: str,
    check_out: str,
    adults: int = 1,
    limit_hotels: int = 100,
    with_rates: bool = False,     # если True — подтянем цены на даты
    alias_location: bool = False, # если True — сохраняем "AER Sochi Сочи", иначе только IATA
) -> Dict[str, Any]:
    """
    Read-through через Xotelo:
      - резолв города в IATA-код через Amadeus (для нормализации location в БД)
      - читаем из БД по IATA
      - Xotelo: search -> location_key -> list (и опц. rates)
      - добавляем новые отели в БД, возвращаем объединённый ответ
    """
    am = AmadeusClient()
    city_code = await am.resolve_city_code(city_input) if len(city_input) != 3 else city_input.upper()
    if not city_code:
        return {"error": f"Не удалось определить IATA-код для '{city_input}'"}

    # 1) уже в БД
    db_before_raw = await db.hotels.get_all(location=city_code, title=None, id=None, limit=2000, offset=0)
    db_before = _extract_hotels(db_before_raw)
    existing_keys = {(h.get("title","").strip().lower(), city_code) for h in db_before}

    # 2) Xotelo: search → получить location_key
    xo = XoteloClient()
    s = await xo.search(city_input)
    # по доке результат в result.list; ищем первую подходящую локацию
    location_key = None
    for item in (s.get("result", {}).get("list", []) or []):
        if "location_key" in item:
            location_key = item["location_key"]
            break
    if not location_key:
        # ничего не нашли в Xotelo
        return {
            "city": {"input": city_input, "code": city_code},
            "stats": {"db_before": len(db_before), "xotelo_found": 0, "inserted": 0, "db_after": len(db_before)},
            "db_items_before": db_before,
            "xotelo_new": [],
            "final_items": db_before,
        }

    # 3) Xotelo: list по локации (можно постранично; здесь одна страница)
    listing = await xo.list_hotels(location_key, limit=min(limit_hotels, 200), offset=0)
    items = listing.get("result", {}).get("hotels") or listing.get("result", {}).get("list") or []
    # унифицируем список отелей
    hotels_basic: List[Dict[str, Any]] = []
    for it in items:
        # у Xotelo в списке обычно есть: name, hotel_key, address/city/...
        title = (it.get("name") or it.get("hotel_name") or "").strip()
        hkey = it.get("hotel_key")
        if not title:
            continue
        hotels_basic.append({"title": title, "hotel_key": hkey})

    # 4) (опционально) rates по датам, делаем параллельно с лимитом
    if with_rates and hotels_basic:
        sem = asyncio.Semaphore(5)
        async def fetch_rate(hotel_key: str | None) -> Dict[str, Any] | None:
            if not hotel_key:
                return None
            async with sem:
                try:
                    r = await xo.rates(hotel_key, chk_in=check_in, chk_out=check_out, adults=adults)
                    return r
                except Exception:
                    return None
        tasks = [asyncio.create_task(fetch_rate(h["hotel_key"])) for h in hotels_basic]
        rates_res = await asyncio.gather(*tasks)
        for h, rr in zip(hotels_basic, rates_res):
            if rr:
                h["rates"] = rr

    # 5) добавляем в БД новые отели (title, location)
    #    location = либо IATA-код, либо алиасы ("MOW Moscow Москва") — по твоему режиму
    created = 0
    for h in hotels_basic:
        title = h["title"]
        loc = f"{city_code} {city_input}" if alias_location else city_code
        key = (title.strip().lower(), city_code)
        if key in existing_keys:
            continue
        if await _ensure_hotel(db, title=title, location=loc):
            created += 1
            existing_keys.add(key)

    if created:
        await db.commit()

    # 6) финально читаем БД
    db_after_raw = await db.hotels.get_all(location=city_code, title=None, id=None, limit=2000, offset=0)
    db_after = _extract_hotels(db_after_raw)

    return {
        "city": {"input": city_input, "code": city_code},
        "stats": {
            "db_before": len(db_before),
            "xotelo_found": len(hotels_basic),
            "inserted": created,
            "db_after": len(db_after),
        },
        "db_items_before": db_before,
        "xotelo_new": [{"title": h["title"], "hotel_key": h.get("hotel_key")} for h in hotels_basic],
        "final_items": db_after,
    }
