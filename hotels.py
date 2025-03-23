from http.client import HTTPException
from sys import prefix
from pydantic import  Field
from fastapi import APIRouter , Query,Body
from schemas.hotels import Hotel, HotelPatch


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
def get_hotels(
        id:int|None = Query(None),
        title:str|None= Query(None),
        name:str|None = Query(None),
        page:int|None = Query(1,description='Номер страницы'),
        page_per:int | None = Query(10, descriprion='Кол-во отелей на странице')
):
    global hotels
    hotels_ = []
    if id is not None:
        hotels_ = [hotel for hotel in hotels_ if hotel['id'] == id]

    if title is not None:
        hotels_= [hotel for hotel in hotels_ if hotel["title"] == title]

    start = (page - 1) * page_per
    end = start + page_per
    return hotels_[start:end]


@router.delete("/{hotel_id}",summary='Удаление отеля из базы данных')
def delete_hotel(hotel_id:int ):
    global hotels
    hotels_ = [hotel for hotel in hotels if hotel['id']!= hotel_id]
    return hotels_

@router.post("",summary='Добавление нового отеля')
def post_hotels(hotel_data: Hotel = Body(openapi_examples={"1":{"summary":"Сочи", 'value':{'title':"Сочи",'name':'Sochi'}}})):
    global hotels
    hotels.append({"id": hotels[-1]['id']+1,"title":hotel_data.title})
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
