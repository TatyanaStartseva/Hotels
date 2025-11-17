from typing import Literal

from black import assert_equivalent
from fastapi import HTTPException

from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep
from src.schemas.hotels import Hotel, HotelPatch, HotelAdd
from src.clients.amadeus import AmadeusClient
from src.services.search_both import search_hotels_read_through_both

router = APIRouter(prefix="/hotels",tags=['Отели'])
from datetime import date
from src.api.dependencies import DBDep
from src.services.search_hotels import search_hotels_catalog_read_through


@router.get('',summary='Получение информации об отелях')
async def get_hotels(
        pagination: PaginationDep,
        db : DBDep,
        id: int | None = Query(None, description="id"),
        title: str | None = Query(None, description="Название отеля"),
        location: str |None = Query(None, description="Адрес"),
):
    per_page = pagination.per_page or 5
    return await db.hotels.get_all(
            id =id,
            location=location,
            title=title,
            limit = per_page,
            offset = per_page * (pagination.page - 1)
        )


@router.delete("/{hotel_id}",summary='Удаление отеля из базы данных')
async def delete_hotel(hotel_id:int,db : DBDep ):
    result = await db.hotels.delete(id=hotel_id)
    await db.commit()
    return result

# НУЖНО ЧТОБЫ ОН ТОЖЕ ПЕРЕДЕЛЫВАЛ ВБИТЫЙ ГОРОД ПО 3 БУКВЫ
@router.post("", summary='Добавление нового отеля')
async def post_hotels(
    db: DBDep,
    hotel_data: HotelAdd = Body(
        openapi_examples={
            "1": {
                "summary": "Сочи",
                "value": {"title": "Сочи Гранд Отель", "location": "Sochi"}
            }
        }
    )
):
    from src.clients.amadeus import AmadeusClient

    # 1) приводим город/локацию к коду
    city_raw = hotel_data.location.strip()
    if len(city_raw) == 3 and city_raw.isalpha():
        city_code = city_raw.upper()
    else:
        am = AmadeusClient()
        city_code = await am.resolve_city_code(city_raw)
        if not city_code:
            raise HTTPException(
                status_code=400,
                detail=f"Не удалось определить IATA-код для '{city_raw}'"
            )

    # 2) создаём копию данных, но с нормализованным city_code
    normalized = HotelAdd(title=hotel_data.title, location=city_code)

    # 3) сохраняем в БД
    hotel = await db.hotels.add(normalized)
    await db.commit()

    return {"status": "ok", "saved": hotel}


@router.patch("/{id}", summary="Частичное обновление данных об отеле",
     description="<h1>Тут мы частично обновляем данные об отеле</h1>")
async def patch_hotels(id:int, hotel_data:HotelPatch,db : DBDep):
    hotel = await db.hotels.edit(hotel_data, exclude_unset=True, id = id)
    if hotel["status"] == 'success':
        await db.commit()
        return {"status": "Ok"}
    else:
        raise HTTPException(status_code=404, detail="Hotel not found")


@router.put("/{id}",summary='Обновление данных об отеле')
async def patch_hotels(id: int,hotel_data:HotelAdd,db : DBDep):
    hotel = await db.hotels.edit(hotel_data,id= id)
    if hotel["status"] =='success':
        await db.commit()
        return {"status": "Ok"}
    else:
        raise HTTPException(status_code=404, detail="Hotel not found")


@router.get("/{hotel_id}")
async def get_hotel(hotel_id:int,db : DBDep):
    return await db.hotels.get_hotel(hotel_id)


@router.post("/ingest/amadeus")
async def ingest_from_amadeus(
    db: DBDep,
    city: str = Query(...),
    check_in: str = Query(...),
    check_out: str = Query(...),
    adults: int = Query(1, ge=1, le=9),
    max_hotels: int = Query(600, ge=1, le=2000),  # ← опционально
):
    from src.services.ingest_amadeus import ingest_hotels_from_amadeus
    #приводим город к 3 буквенному значению
    city_raw = city.strip()
    if len(city_raw) == 3 and city_raw.isalpha():
        code = city_raw.upper()
    else:
        am = AmadeusClient()
        code = await am.resolve_city_code(city_raw)
        if not code:
            raise HTTPException(status_code = 400, detail=f"Не удалось определить IATA-код для '{city}'")

    summary = await ingest_hotels_from_amadeus(
        db, city_code=code, check_in=check_in, check_out=check_out, adults=adults
    )
    return {"status": "ok", **summary}


@router.get("/actions/search", summary="Поиск отелей + пополнение каталога (Amadeus/Xotelo/both)")
async def search_hotels_both(
    db: DBDep,
    city: str = Query(..., description="Город: Moscow/Москва/или IATA (MOW)"),
    check_in: str = Query(..., description="YYYY-MM-DD"),
    check_out: str = Query(..., description="YYYY-MM-DD"),
    adults: int = Query(1, ge=1, le=9),
    providers: Literal["amadeus", "xotelo", "both"] = Query("both"),
    # провайдер-специфичные параметры:
    max_hotels_amadeus: int = Query(400, ge=1, le=1200),
    limit_hotels_xotelo: int = Query(80, ge=1, le=200),
    with_rates: bool = Query(False, description="Подтянуть цены Xotelo (/rates) — медленнее"),
    alias_location: bool = Query(False, description='Сохранять алиасы в location (например "MOW Moscow Москва")'),
):
    # валидация дат
    try:
        din = date.fromisoformat(check_in); dout = date.fromisoformat(check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Формат дат YYYY-MM-DD")
    if dout <= din:
        raise HTTPException(status_code=400, detail="check_out должен быть позже check_in")

    return await search_hotels_read_through_both(
        db=db,
        city_input=city.strip(),
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        providers=providers,
        max_hotels_amadeus=max_hotels_amadeus,
        limit_hotels_xotelo=limit_hotels_xotelo,
        with_rates=with_rates,
        alias_location=alias_location,
    )