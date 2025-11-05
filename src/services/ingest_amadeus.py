from src.clients.amadeus import AmadeusClient
from src.utils.db_manager import DBManager
from src.schemas.hotels import HotelAdd

async def ingest_hotels_from_amadeus(
    db: DBManager, *, city_code: str, check_in: str, check_out: str, adults: int = 1
) -> dict:
    am = AmadeusClient()
    raw = await am.search_offers_by_city(
        city_code=city_code.upper(),
        check_in=check_in,
        check_out=check_out,
        adults=adults,
    )

    added = 0
    seen: set[tuple[str, str]] = set()

    for item in raw:
        hotel = item.get("hotel") or {}
        name = hotel.get("name")
        # address.cityName -> fallback
        address = (hotel.get("address") or {}).get("cityName") or hotel.get("cityCode") or city_code
        if not name:
            continue
        key = (name, address)
        if key in seen:
            continue
        seen.add(key)

        exists = await db.hotels.get_filtered(title=name, location=address)

        # если метод возвращает список — вставляем, когда список пуст
        if not exists:
            await db.hotels.add(HotelAdd(title=name, location=address))
            added += 1

    await db.commit()
    return {"found": len(raw), "unique": len(seen), "inserted": added}
