from http.client import HTTPException
from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep
from src.schemas.hotels import Hotel, HotelPatch, HotelAdd
from src.api.dependencies import DBDep

router = APIRouter(prefix="/hotels",tags=['Отели'])


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

@router.post("",summary='Добавление нового отеля')
async def post_hotels(db : DBDep,hotel_data: HotelAdd = Body(openapi_examples={"1":{"summary":"Сочи", 'value':{'title':"Сочи",'location':'Sochi'}}})):
    hotel = await db.hotels.add(hotel_data)
    await db.commit()
    return {'status':"ok", "date":hotel}


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

from src.clients.amadeus import AmadeusClient
@router.get("/health/amadeus")
async def amadeus_health():
    am = AmadeusClient()
    # просто пробуем получить токен
    await am._ensure_token()
    return {"status": "ok"}
