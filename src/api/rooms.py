from fastapi import APIRouter, Query, Body, HTTPException
from datetime import date

from src.api.dependencies import DBDep, HotelOwnerDep, ensure_hotel_owner_or_admin
from src.schemas.rooms import RoomAdd, PatchRoom, RoomAddRequest, PatchRoomRequest

router = APIRouter(prefix="/rooms", tags=["Комнаты"])


@router.get("/{hotel_id}/rooms")
async def get_rooms(
    hotel_id: int,
    db: DBDep,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
):
    if date_from and date_to:
        return await db.rooms.get_with_availability(
            hotel_id=hotel_id,
            date_from=date_from,
            date_to=date_to,
        )
    return await db.rooms.get_filtered(hotel_id=hotel_id)


@router.get("/{hotel_id}/rooms/{room_id}", summary="Получение информации о комнате")
async def get_room(hotel_id: int, room_id: int, db: DBDep):
    return await db.rooms.get_one_or_none(id=room_id, hotel_id=hotel_id)


@router.post("/{hotel_id}/rooms", summary="Добавление комнаты")
async def create_room(
    hotel_id: int,
    db: DBDep,
    owner_id: HotelOwnerDep,
    room_data: RoomAddRequest = Body(
        openapi_examples={
            "1": {
                "summary": "Пример комнаты",
                "value": {
                    "title": "Люкс",
                    "price": 150,
                    "quantity": 2
                }
            }
        }
    ),
):
    await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    _room_data = RoomAdd(hotel_id=hotel_id, **room_data.model_dump())
    room = await db.rooms.add(_room_data)
    await db.commit()
    return {"status": "ok", "data": room}


@router.delete("/{hotel_id}/rooms/{room_id}", summary="Удалить комнату")
async def delete_room(
    hotel_id: int,
    room_id: int,
    db: DBDep,
    owner_id: HotelOwnerDep,
):
    await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    room = await db.rooms.get_one_or_none(id=room_id, hotel_id=hotel_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    result = await db.rooms.delete(id=room_id, hotel_id=hotel_id)
    await db.commit()
    return result


@router.patch("/{hotel_id}/rooms/{room_id}", summary="Изменить часть информации о комнате")
async def patch_room(
    hotel_id: int,
    room_id: int,
    room_data: PatchRoomRequest,
    db: DBDep,
    owner_id: HotelOwnerDep,
):
    await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    room = await db.rooms.get_one_or_none(id=room_id, hotel_id=hotel_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    _room_data = PatchRoom(
        hotel_id=hotel_id,
        **room_data.model_dump(exclude_unset=True)
    )

    res = await db.rooms.edit(
        _room_data,
        exclude_unset=True,
        id=room_id,
        hotel_id=hotel_id,
    )

    if res["status"] == "success":
        await db.commit()
        return {"status": "Ok"}
    raise HTTPException(status_code=404, detail="Room not found")


@router.put("/{hotel_id}/rooms/{room_id}", summary="Полное обновление информации о комнате")
async def edit_room(
    hotel_id: int,
    room_id: int,
    room_data: RoomAddRequest,
    db: DBDep,
    owner_id: HotelOwnerDep,
):
    await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    room = await db.rooms.get_one_or_none(id=room_id, hotel_id=hotel_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    _room_data = RoomAdd(hotel_id=hotel_id, **room_data.model_dump())

    res = await db.rooms.edit(
        _room_data,
        id=room_id,
        hotel_id=hotel_id,
    )

    if res["status"] == "success":
        await db.commit()
        return {"status": "Ok"}
    raise HTTPException(status_code=404, detail="Room not found")