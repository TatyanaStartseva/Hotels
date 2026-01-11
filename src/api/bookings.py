from fastapi import APIRouter

from src.api.dependencies import DBDep, UserIdDep
from src.schemas.bookings import BookingAddRequest, BookingAdd
from sqlalchemy import select, func
from fastapi import HTTPException
from src.models.rooms import RoomsOrm
from src.models.bookings import BookingsOrm
from datetime import date
router = APIRouter(prefix="/bookings", tags=["Бронирования"])

#возвращает все бронирования, которые есть
@router.get("")
async def get_bookings(db: DBDep):
    return await db.bookings.get_all()

#если пользователь залогинился(auth/login), то ручка отдаст все бронирования этого пользователя
@router.get("/me")
async def get_my_bookings(user_id: UserIdDep, db: DBDep):
    return await db.bookings.get_filtered(user_id=user_id)

#Добавляет запись на бронирования опред. отеля этим пользователем (он должен быть залогиненным auth/login)
@router.post("")
async def add_booking(user_id: UserIdDep, db: DBDep, booking_data: BookingAddRequest):
    room = await db.rooms.get_one_or_none(id=booking_data.room_id)
    if not room:
        raise HTTPException(404, "Room not found")
    today = date.today()
    if booking_data.date_from < today:
        raise HTTPException(422, detail ="Нельзя бронировать комнаты в прошлом",)
    if booking_data.date_from >= booking_data.date_to:
        raise HTTPException(422, detail="Дата заезда должна быть раньше даты выезда")

    # запрещаем этому пользователю бронировать эту же комнату на пересекающиеся даты
    user_overlap = (await db.session.execute(
        select(func.count(BookingsOrm.id)).where(
            BookingsOrm.room_id == room.id,
            BookingsOrm.user_id == user_id,
            BookingsOrm.date_from < booking_data.date_to,
            BookingsOrm.date_to > booking_data.date_from,
        )
    )).scalar_one()

    if user_overlap > 0:
        raise HTTPException(
            status_code=409,
            detail="Вы уже бронировали эту комнату на пересекающиеся даты",
        )

    # твоя текущая проверка доступности по quantity
    booked = (await db.session.execute(
        select(func.count(BookingsOrm.id)).where(
            BookingsOrm.room_id == room.id,
            BookingsOrm.date_from < booking_data.date_to,
            BookingsOrm.date_to > booking_data.date_from,
        )
    )).scalar_one()

    if booked >= room.quantity:
        raise HTTPException(status_code=409, detail="Нет свободных номеров на эти даты")

    room_price: int = room.price
    _booking_data = BookingAdd(
        user_id=user_id,
        price=room_price,
        **booking_data.model_dump(),
    )
    booking = await db.bookings.add(_booking_data)
    await db.commit()
    return {"status": "OK", "data": booking}


