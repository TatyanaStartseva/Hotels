from fastapi import HTTPException       # ✅ правильное исключение FastAPI

from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep
from src.schemas.hotels import Hotel, HotelPatch, HotelAdd
from src.api.dependencies import DBDep
from src.clients.amadeus import AmadeusClient

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
    summary = await ingest_hotels_from_amadeus(
        db, city_code=city, check_in=check_in, check_out=check_out, adults=adults
    )
    return {"status": "ok", **summary}


@router.get("/actions/search", summary="Поиск/пополнение каталога отелей (только hotels)")
async def search_hotels(
    db: DBDep,
    city: str = Query(..., description="IATA (PAR/MOW) или имя города (Moscow/Krasnodar)"),
    check_in: str = Query(..., description="YYYY-MM-DD"),
    check_out: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        din = date.fromisoformat(check_in)
        dout = date.fromisoformat(check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Дата должна быть в формате YYYY-MM-DD")
    if dout <= din:
        raise HTTPException(status_code=400, detail="check_out должен быть позже check_in")

    city_raw = city.strip()

    if len(city_raw) == 3 and city_raw.isalpha():
        code = city_raw.upper()
    else:
        am = AmadeusClient()
        code = await am.resolve_city_code(city_raw)  # ← передаём исходную строку
        if not code:
            raise HTTPException(status_code=400, detail=f"Не удалось определить IATA-код для '{city}'")

    city_norm = code

    return await search_hotels_catalog_read_through(
        db, city_code=city_norm, check_in=check_in, check_out=check_out
    )