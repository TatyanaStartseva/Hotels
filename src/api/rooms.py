from sys import prefix

from fastapi import APIRouter, Query, Body

from src.database import async_session_maker
from src.repositories.rooms import RoomsRepositories
from src.schemas.rooms import RoomAdd
from src.models.rooms import RoomsOrm

router = APIRouter(prefix="/rooms", tags=['Комнаты'])


@router.get('', summary='Получение информации об комнате')
async def get_all(hotel_id: int = Query(None, description='Id отеля'),
                  title: str = Query(None, description='Название отеля'),
                  description: str = Query(None, description='Описание'),
                  price: int = Query(None, description='Цена за комнату'),
                  quantity: str = Query(None, description='Качество')):
    async with async_session_maker() as session:
        return await RoomsRepositories(session).get_all(hotel_id=hotel_id, title=title, description=description,
                                                         price=price, quantity=quantity)


@router.post("", summary='Добавление комнаты')
async def post_room(room_data: RoomAdd = Body(openapi_examples={"1": {"summary": "Сочи", 'value': {'hotel_id': 1,
                                                                                                   'title': "Отель 5 звезд",
                                                                                                   'price': 150,
                                                                                                   "quantity": 2}}})):
    async with async_session_maker() as session:
        room = await RoomsRepositories(session).add(room_data)
        await session.commit()
    return {'status': "ok", "date": room}
