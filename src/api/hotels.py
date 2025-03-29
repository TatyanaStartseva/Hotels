from http.client import HTTPException
from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep
from src.database import async_session_maker
from src.models.hotels import HotelsOrm
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

):
    per_page = pagination.per_page or 5
    async with async_session_maker() as session:
        query = select(HotelsOrm)
        if id:
            query = query.filter_by(id=id)
        if title:
            query = query.filter_by(title=title)
        query = (
            query
            .limit(per_page)
            .offset(pagination.per_page * (pagination.page - 1))
        )

        result = await session.execute(query)
        hotels = result.scalars().all()
        return hotels



@router.delete("/{hotel_id}",summary='Удаление отеля из базы данных')
def delete_hotel(hotel_id:int ):
    global hotels
    hotels_ = [hotel for hotel in hotels if hotel['id']!= hotel_id]
    return hotels_

@router.post("",summary='Добавление нового отеля')
async def post_hotels(hotel_data: Hotel = Body(openapi_examples={"1":{"summary":"Сочи", 'value':{'title':"Сочи",'location':'Sochi'}}})):
    async with async_session_maker() as session:
        add_hotel_stmt = insert(HotelsOrm).values(**hotel_data.model_dump())
        print(add_hotel_stmt.compile(compile_kwargs={"literal_binds":True}))
        await session.execute(add_hotel_stmt)
        await session.commit()
    return {'status':"ok"}


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
def patch_hotels(id: int,hotel_data:Hotel):
    global hotels
    for hotel in hotels:
        if hotel_data.title and hotel_data.name and hotel['id'] == id:
            hotel['title'] = hotel_data.title
            hotel['name']= hotel_data.name
            return {"status":"Ok"}
    raise HTTPException(status_code=404, detail="Hotel not found")
