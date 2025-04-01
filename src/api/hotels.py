from http.client import HTTPException
from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep
from src.database import async_session_maker
from src.models.hotels import HotelsOrm
from src.repositories.hotels import HotelsRepository
from src.schemas.hotels import Hotel, HotelPatch
from sqlalchemy import insert, select

router = APIRouter(prefix="/hotels",tags=['Отели'])
hotels = [
     {"id": 1, "title": "Sochi", "name": "sochi"},
     {"id": 2, "title": "Дубай", "name": "dubai"},
     {"id": 3, "title": "Мальдивы", "name": "maldivi"},
     {"id": 4, "title": "Геленджик", "name": "gelendzhik"},
     {"id": 5, "title": "Москва", "name": "moscow"},
     {"id": 6, "title": "Казань", "name": "kazan"},
     {"id": 7, "title": "Санкт-Петербург", "name": "spb"},
 ]


@router.get('',summary='Получение информации об отелях')
async def get_hotels(
        pagination: PaginationDep,
        id: int | None = Query(None, description="id"),
        title: str | None = Query(None, description="Название отеля"),
        location: str |None = Query(None, description="Адрес"),
):
    per_page = pagination.per_page or 5
    async with async_session_maker() as session:
        return await HotelsRepository(session).get_all(
            location=location,
            title=title,
            limit = per_page,
            offset = per_page * (pagination.page - 1)
        )


@router.delete("/{hotel_id}",summary='Удаление отеля из базы данных')
async def delete_hotel(hotel_id:int ):
    async with async_session_maker() as session:
        result = await HotelsRepository(session).delete(id=hotel_id)
        await session.commit()
    return result

@router.post("",summary='Добавление нового отеля')
async def post_hotels(hotel_data: Hotel = Body(openapi_examples={"1":{"summary":"Сочи", 'value':{'title':"Сочи",'location':'Sochi'}}})):
    async with async_session_maker() as session:
        hotel = await HotelsRepository(session).add(hotel_data)
        await session.commit()
    return {'status':"ok", "date":hotel}


@router.patch("/{id}", summary="Частичное обновление данных об отеле",
     description="<h1>Тут мы частично обновляем данные об отеле: можно отправить name, а можно title</h1>")
def patch_hotels(id:int, hotel_data:HotelPatch):
    global hotels
    for hotel in hotels:
        if hotel_data.title and hotel['id'] == id:
            hotel['title'] = hotel_data.title
        if hotel_data.name and hotel['id'] == id:
            hotel['name']= hotel_data.name
    return {"status":"Ok"}


@router.put("/{id}",summary='Обновление данных об отеле')
async def patch_hotels(id: int,hotel_data:Hotel):
    async with async_session_maker() as session:
        hotel = await HotelsRepository(session).edit(hotel_data,id= id)
        if hotel["status"] =='success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Hotel not found")
