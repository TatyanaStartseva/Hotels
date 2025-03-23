from http.client import HTTPException
from sys import prefix

from fastapi import APIRouter , Query, Body

router = APIRouter(prefix="/hotels",tags=['Отели'])
hotels = [
    {"id":1, "title":"Sochi"}
]
@router.get('',summary='Получение информации об отелях')
def get_hotels(
        id: int| None =Query(None,  description= "id"),
        title : str| None= Query(None, description = "Название отеля")
):
    global hotels
    hotels_ = []
    for hotel in hotels:
        if id and hotel['id'] != id:
            continue
        if title and hotel["title"] != title:
            continue
        hotels_.append(hotel)
    return hotels_

@router.delete("/{hotel_id}",summary='Удаление отеля из базы данных')
def delete_hotel(hotel_id:int ):
    global hotels
    hotels_ = [hotel for hotel in hotels if hotel['id']!= hotel_id]
    return hotels_

@router.post("",summary='Добавление нового отеля')
def post_hotels(title:str = Body(embed=True)):
    global hotels
    hotels.append({"id": hotels[-1]['id']+1,"title":title})
    return {'status':"ok"}


@router.patch("/{id}", summary="Частичное обновление данных об отеле",
     description="<h1>Тут мы частично обновляем данные об отеле: можно отправить name, а можно title</h1>")
def patch_hotels(id:int, title: str|None= Body(None,description="Название"), name: str|None = Body(None,description="Имя")):
    global hotels
    for hotel in hotels:
        if title and hotel['id'] == id:
            hotel['title'] = title
        if name and hotel['id'] == id:
            hotel['name']= name
    return {"status":"Ok"}


@router.put("/{id}",summary='Обновление данных об отеле')
def patch_hotels(id: int,title: str= Body(...,description="Название"), name: str = Body(...,description="Имя")):
    global hotels
    for hotel in hotels:
        if title and name and hotel['id'] == id:
            hotel['title'] = title
            hotel['name']= name
            return {"status":"Ok"}
    raise HTTPException(status_code=404, detail="Hotel not found")
