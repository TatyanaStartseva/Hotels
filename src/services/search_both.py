from __future__ import annotations
from typing import Any, Dict, List, Tuple
import asyncio

from src.utils.db_manager import DBManager
from src.schemas.hotels import HotelAdd
from src.clients.amadeus import AmadeusClient
from src.clients.xotelo import XoteloClient  # см. ранее добавленный клиент

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

async def _amadeus_fetch(city_code: str, check_in: str, check_out: str, adults: int, max_hotels: int) -> list[dict]:
    am = AmadeusClient()
    raw = await am.search_offers_by_city(
        city_code=city_code, check_in=check_in, check_out=check_out, adults=adults, max_hotels=max_hotels
    )
    out: list[dict] = []
    for item in raw or []:
        h = item.get("hotel") or {}
        title = (h.get("name") or "").strip()
        if title:
            out.append({"title": title})
    return out

import logging
log = logging.getLogger(__name__)

async def _xotelo_fetch(city_input: str, check_in: str, check_out: str, adults: int,
                        limit_hotels: int, with_rates: bool) -> list[dict]:
    from src.clients.xotelo import XoteloClient

    xo = XoteloClient()

    try:
        s = await xo.search(city_input)

        # 1) Ответ должен быть dict. Если None/строка/что-то ещё — просто пусто
        if not isinstance(s, dict):
            log.warning("Xotelo /search returned non-dict: %r", s)
            return []

        # 2) Явная ошибка от клиента — логируем и выходим пусто
        if "_error" in s:
            err = s["_error"]
            # Геоблок/доступ — штатно возвращаем пусто
            status = (err.get("status") or err.get("status_code") or err.get("code"))
            log.warning("Xotelo /search error: %s", err)
            return []

        # 3) Достаём список локаций (schema у Xotelo гуляет)
        lst = []
        result = s.get("result")
        if isinstance(result, dict):
            lst = result.get("list") or result.get("items") or []
        if not lst:
            for k in ("list", "items", "locations", "results", "data"):
                v = s.get(k)
                if isinstance(v, list):
                    lst = v
                    break
        if not isinstance(lst, list):
            lst = []

        # Берём первый location_key
        location_key = None
        for item in lst:
            if isinstance(item, dict) and "location_key" in item:
                location_key = item["location_key"]
                break

        if not location_key:
            log.warning("Xotelo: location_key not found. Search payload preview: %s", str(s)[:600])
            return []

        # 4) Получаем список отелей
        listing = await xo.list_hotels(location_key, limit=min(limit_hotels, 200), offset=0)
        if not isinstance(listing, dict):
            log.warning("Xotelo /list returned non-dict: %r", listing)
            return []
        if "_error" in listing:
            log.warning("Xotelo /list error: %s", listing["_error"])
            return []

        items = []
        r2 = listing.get("result")
        if isinstance(r2, dict):
            items = r2.get("hotels") or r2.get("list") or r2.get("items") or []
        if not items:
            for k in ("hotels", "list", "items", "results", "data"):
                v = listing.get(k)
                if isinstance(v, list):
                    items = v
                    break
        if not isinstance(items, list):
            items = []

        hotels: list[dict] = []
        for it in items:
            if not isinstance(it, dict):
                continue
            title = (it.get("name") or it.get("hotel_name") or "").strip()
            if title:
                hotels.append({
                    "title": title,
                    "hotel_key": it.get("hotel_key") or it.get("hotelKey") or it.get("key"),
                })

        # 5) (опционально) подтянуть цены — не ломаемся, если /rates ошибётся
        if with_rates and hotels:
            sem = asyncio.Semaphore(5)

            async def fetch_rate(h: dict) -> None:
                hkey = h.get("hotel_key")
                if not hkey:
                    return
                async with sem:
                    try:
                        r = await xo.rates(hkey, chk_in=check_in, chk_out=check_out, adults=adults)
                        if isinstance(r, dict) and "_error" not in r:
                            h["rates"] = r
                    except Exception as e:
                        log.warning("Xotelo /rates failed for %s: %s", hkey, e)

            await asyncio.gather(*(fetch_rate(h) for h in hotels), return_exceptions=True)

        return hotels

    except Exception as e:
        log.exception("Xotelo fetch failed: %s", e)
        return []


async def search_hotels_read_through_both(
    db: DBManager,
    *,
    city_input: str,
    check_in: str,
    check_out: str,
    adults: int,
    providers: str,                   # "amadeus" | "xotelo" | "both"
    max_hotels_amadeus: int,
    limit_hotels_xotelo: int,
    with_rates: bool,
    alias_location: bool,
) -> Dict[str, Any]:
    # 0) Нормализуем город в IATA (для хранения в БД)
    am = AmadeusClient()
    city_code = city_input.upper() if (len(city_input) == 3 and city_input.isalpha()) else await am.resolve_city_code(city_input)
    if not city_code:
        return {"error": f"Не удалось определить IATA-код для '{city_input}'"}

    # 1) Что уже в БД
    db_before_raw = await db.hotels.get_all(location=city_code, title=None, id=None, limit=2000, offset=0)
    db_before = _extract_hotels(db_before_raw)
    existing_keys = {(h.get("title","").strip().lower(), city_code) for h in db_before}

    # 2) Параллельно тянем провайдеров (в зависимости от выбора)
    tasks = []
    if providers in ("amadeus", "both"):
        tasks.append(asyncio.create_task(_amadeus_fetch(city_code, check_in, check_out, adults, max_hotels_amadeus)))
    else:
        tasks.append(asyncio.create_task(asyncio.sleep(0, result=[])))  # пустышка

    if providers in ("xotelo", "both"):
        tasks.append(asyncio.create_task(_xotelo_fetch(city_input, check_in, check_out, adults,
                                                       limit_hotels_xotelo, with_rates)))
    else:
        tasks.append(asyncio.create_task(asyncio.sleep(0, result=[])))

    am_hotels, xo_hotels = await asyncio.gather(*tasks)

    # 3) Мердж + дедуп (по title + IATA)
    merged: list[dict] = []
    seen = set(existing_keys)  # уже в БД считаем увиденными
    for src, lst in (("amadeus", am_hotels), ("xotelo", xo_hotels)):
        for h in lst or []:
            title = (h.get("title") or "").strip()
            if not title:
                continue
            key = (title.lower(), city_code)
            if key in seen:
                continue
            merged.append({"title": title, "source": src, **({"hotel_key": h.get("hotel_key")} if "hotel_key" in h else {})})
            seen.add(key)

    # 4) Вставляем новые в БД
    created = 0
    for m in merged:
        title = m["title"]
        location = f"{city_code} {city_input}" if alias_location else city_code
        if await _ensure_hotel(db, title=title, location=location):
            created += 1
    if created:
        await db.commit()

    # 5) Финально читаем БД
    db_after_raw = await db.hotels.get_all(location=city_code, title=None, id=None, limit=2000, offset=0)
    db_after = _extract_hotels(db_after_raw)

    return {
        "city": {"input": city_input, "code": city_code},
        "providers": {
            "amadeus_count": len(am_hotels or []),
            "xotelo_count": len(xo_hotels or []),
        },
        "stats": {
            "db_before": len(db_before),
            "new_candidates": len(merged),
            "inserted": created,
            "db_after": len(db_after),
        },
        "db_items_before": db_before,
        "new_from_providers": merged,   # что нашли новенького и пытались вставить
        "final_items": db_after,        # «источник истины» из БД
    }
