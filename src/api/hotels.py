from http.client import HTTPException
from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep
from src.database import async_session_maker
from src.models.hotels import HotelsOrm
from src.repositories.hotels import HotelsRepository
from src.schemas.hotels import Hotel, HotelPatch, HotelAdd

router = APIRouter(prefix="/hotels",tags=['Отели'])


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
async def post_hotels(hotel_data: HotelAdd = Body(openapi_examples={"1":{"summary":"Сочи", 'value':{'title':"Сочи",'location':'Sochi'}}})):
    async with async_session_maker() as session:
        hotel = await HotelsRepository(session).add(hotel_data)
        await session.commit()
    return {'status':"ok", "date":hotel}


@router.patch("/{id}", summary="Частичное обновление данных об отеле",
     description="<h1>Тут мы частично обновляем данные об отеле: можно отправить name, а можно title</h1>")
async def patch_hotels(id:int, hotel_data:HotelPatch):
    async with async_session_maker() as session:
        hotel = await HotelsRepository(session).edit(hotel_data, exclude_unset=True, id = id)
        if hotel["status"] == 'success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Hotel not found")


@router.put("/{id}",summary='Обновление данных об отеле')
async def patch_hotels(id: int,hotel_data:HotelAdd):
    async with async_session_maker() as session:
        hotel = await HotelsRepository(session).edit(hotel_data,id= id)
        if hotel["status"] =='success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Hotel not found")


@router.get("/{hotel_id}")
async def get_hotel(hotel_id:int):
    async with async_session_maker() as session:
        return await HotelsRepository(session).get_hotel(hotel_id)