from fastapi import HTTPException

from fastapi import APIRouter
from src.schemas.bookings import BookingsAdd, Bookings
from src.api.dependencies import DBDep
router= APIRouter(prefix="/bookings",tags=['Бронирование'])

@router.post('',summary='Бронирование отеля')
async def post_bookings(bookings_data: BookingsAdd, db : DBDep):
    room_price = await db.rooms.get_room(bookings_data.room_id)
    exist_user = await db.users.get_one_or_none(id = bookings_data.user_id)

    if exist_user is None:
        return  HTTPException(status_code=404, detail="User not found")

    bookings = Bookings(**bookings_data.model_dump(), price = room_price.price)
    bookings_add = await db.bookings.add(bookings)
    await db.commit()
    return {"status": "ok", "saved": bookings_add}