from sys import prefix

from fastapi import APIRouter, Query, Body, HTTPException

from src.database import async_session_maker
from src.repositories.rooms import RoomsRepositories
from src.schemas.rooms import RoomAdd, PatchRoom
from src.models.rooms import RoomsOrm

router = APIRouter(prefix="/rooms", tags=['Комнаты'])


@router.get('', summary='Получение информации об комнатах')
async def get_all(hotel_id: int = Query(None, description='Id отеля'),
                  title: str = Query(None, description='Название отеля'),
                  description: str = Query(None, description='Описание'),
                  price: int = Query(None, description='Цена за комнату'),
                  quantity: str = Query(None, description='Качество')):
    async with async_session_maker() as session:
        return await RoomsRepositories(session).get_all(hotel_id=hotel_id, title=title, description=description,
                                                         price=price, quantity=quantity)
@router.get("/{room_id}", summary='Получение информации об комнате')
async def get_room(room_id:int):
    async with async_session_maker() as session:
        return await RoomsRepositories(session).get_room(room_id)

@router.post("", summary='Добавление комнаты')
async def post_room(room_data: RoomAdd = Body(openapi_examples={"1": {"summary": "Сочи", 'value': {'hotel_id': 1,
                                                                                                   'title': "Отель 5 звезд",
                                                                                                   'price': 150,
                                                                                                   "quantity": 2}}})):
    async with async_session_maker() as session:
        room = await RoomsRepositories(session).add(room_data)
        await session.commit()
    return {'status': "ok", "date": room}

@router.delete("/{room_id}", summary='Удалить комнату')
async def delete_room(room_id : int):
    async with async_session_maker() as session:
        result = await RoomsRepositories(session).delete(id=room_id)
        await session.commit()
    return result

@router.patch('/{room_id}', summary='Изменить часть информации об комнате')
async def patch_room(room_id:int, room_data: PatchRoom):
    async with async_session_maker() as session:
        res = await RoomsRepositories(session).edit(room_data, exclude_unset=True, id = room_id)
        if res["status"] == 'success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Room not found")

@router.put("/{room_id}",summary='Изменение информации об комнате')
async def put_room(room_id:int, room_data: RoomAdd):
    async with async_session_maker() as session:
        res = await RoomsRepositories(session).edit(room_data,id = room_id)
        if res["status"] == 'success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Room not found")
