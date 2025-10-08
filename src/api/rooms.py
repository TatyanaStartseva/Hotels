from sys import prefix

from fastapi import APIRouter, Query, Body, HTTPException

from src.api.dependencies import DBDep
from src.database import async_db_maker
from src.repositories.rooms import RoomsRepositories
from src.schemas.rooms import RoomAdd, PatchRoom, RoomAddRequest, PatchRoomRequest
from src.models.rooms import RoomsOrm

router = APIRouter(prefix="/rooms", tags=['Комнаты'])


@router.get('/{hotel_id}/rooms', summary='Получение информации об комнатах')
async def get_rooms(hotel_id:int, db : DBDep):
    return await db.rooms.get_filtered(hotel_id=hotel_id)

@router.get("/{hotel_id}/rooms/{room_id}", summary='Получение информации об комнате')
async def get_room(hotel_id:int, room_id:int, db : DBDep):
    return await db.rooms.get_one_or_none(id=room_id,hotel_id=hotel_id)

@router.post("/{hotel_id}/rooms", summary='Добавление комнаты')
async def create_room(hotel_id: int , db : DBDep, room_data: RoomAddRequest = Body(openapi_examples={"1": {"summary": "Сочи", 'value': { 'title': "Люкс",
                                                                                                   'price': 150,
                                                                                                   "quantity": 2}}})):
    _room_data= RoomAdd(hotel_id=hotel_id, **room_data.model_dump())
    room = await db.rooms.add(_room_data)
    await db.commit()
    return {'status': "ok", "date": room}

@router.delete("/{hotel_id}/rooms/{room_id}", summary='Удалить комнату')
async def delete_room(hotel_id: int, room_id : int, db : DBDep):
    result = await db.rooms.delete(id=room_id,hotel_id=hotel_id)
    await db.commit()
    return result

@router.patch('/{hotel_id}/rooms/{room_id}', summary='Изменить часть информации об комнате')
async def patch_room(hotel_id:int,room_id:int, room_data: PatchRoomRequest, db : DBDep):
    _room_data = PatchRoom(hotel_id=hotel_id,**room_data.model_dump(exclude_unset=True))
    res = await db.rooms.edit(_room_data, exclude_unset=True, id = room_id, hotel_id=hotel_id)
    if res["status"] == 'success':
        await db.commit()
        return {"status": "Ok"}
    else:
        raise HTTPException(status_code=404, detail="Room not found")

@router.put("/{hotel_id}/rooms/{room_id}",summary='Изменение информации об комнате')
async def edit_room(hotel_id:int, room_id:int, room_data: RoomAddRequest, db : DBDep):
    _room_data = RoomAdd(hotel_id=hotel_id, **room_data.model_dupm())
    res = await db.rooms.edit(_room_data,id = room_id)
    if res["status"] == 'success':
        await db.commit()
        return {"status": "Ok"}
    else:
        raise HTTPException(status_code=404, detail="Room not found")
