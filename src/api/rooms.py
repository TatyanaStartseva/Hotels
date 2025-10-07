from sys import prefix

from fastapi import APIRouter, Query, Body, HTTPException

from src.database import async_session_maker
from src.repositories.rooms import RoomsRepositories
from src.schemas.rooms import RoomAdd, PatchRoom, RoomAddRequest, PatchRoomRequest
from src.models.rooms import RoomsOrm

router = APIRouter(prefix="/rooms", tags=['Комнаты'])


@router.get('/{hotel_id}/rooms', summary='Получение информации об комнатах')
async def get_rooms(hotel_id:int):
    async with async_session_maker() as session:
        return await RoomsRepositories(session).get_filtered(hotel_id=hotel_id)

@router.get("/{hotel_id}/rooms/{room_id}", summary='Получение информации об комнате')
async def get_room(hotel_id:int, room_id:int):
    async with async_session_maker() as session:
        return await RoomsRepositories(session).get_one_or_none(id=room_id,hotel_id=hotel_id)

@router.post("/{hotel_id}/rooms", summary='Добавление комнаты')
async def create_room(hotel_id: int, room_data: RoomAddRequest = Body(openapi_examples={"1": {"summary": "Сочи", 'value': { 'title': "Люкс",
                                                                                                   'price': 150,
                                                                                                   "quantity": 2}}})):
    _room_data= RoomAdd(hotel_id=hotel_id, **room_data.model_dump())
    async with async_session_maker() as session:
        room = await RoomsRepositories(session).add(_room_data)
        await session.commit()
    return {'status': "ok", "date": room}

@router.delete("/{hotel_id}/rooms/{room_id}", summary='Удалить комнату')
async def delete_room(hotel_id: int, room_id : int):
    async with async_session_maker() as session:
        result = await RoomsRepositories(session).delete(id=room_id,hotel_id=hotel_id)
        await session.commit()
    return result

@router.patch('/{hotel_id}/rooms/{room_id}', summary='Изменить часть информации об комнате')
async def patch_room(hotel_id:int,room_id:int, room_data: PatchRoomRequest):
    _room_data = PatchRoom(hotel_id=hotel_id,**room_data.model_dump(exclude_unset=True))
    async with async_session_maker() as session:
        res = await RoomsRepositories(session).edit(_room_data, exclude_unset=True, id = room_id, hotel_id=hotel_id)
        if res["status"] == 'success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Room not found")

@router.put("/{hotel_id}/rooms/{room_id}",summary='Изменение информации об комнате')
async def edit_room(hotel_id:int, room_id:int, room_data: RoomAddRequest):
    _room_data = RoomAdd(hotel_id=hotel_id, **room_data.model_dupm())
    async with async_session_maker() as session:
        res = await RoomsRepositories(session).edit(_room_data,id = room_id)
        if res["status"] == 'success':
            await session.commit()
            return {"status": "Ok"}
        else:
            raise HTTPException(status_code=404, detail="Room not found")
