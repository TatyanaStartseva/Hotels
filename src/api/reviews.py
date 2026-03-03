from fastapi import APIRouter, HTTPException, Query, Body
from src.api.dependencies import DBDep, UserIdDep, AdminDep
from src.schemas.reviews import ReviewAdd, ReviewReply, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Отзывы"])


@router.get("", summary="Список отзывов по отелю")
async def list_reviews(
    db: DBDep,
    hotel_id: int = Query(...),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await db.reviews.list_by_hotel(hotel_id=hotel_id, limit=limit, offset=offset)


@router.post("", summary="Создать отзыв (только если была бронь)")
async def create_review(
    db: DBDep,
    user_id: UserIdDep,
    data: ReviewAdd = Body(...),
):
    # 1) достаем бронь
    booking = await db.bookings.get_by_id(data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    # 2) бронь должна принадлежать пользователю
    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Это не ваша бронь")

    # 3) бронь должна относиться к отелю (через комнату)
    room = await db.rooms.get_room(booking.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")

    hotel_id = room.hotel_id

    # 4) создаем отзыв
    obj = await db.reviews.create(
        hotel_id=hotel_id,
        user_id=user_id,
        booking_id=data.booking_id,
        rating=data.rating,
        text=data.text,
    )
    await db.commit()
    return ReviewOut.model_validate(obj, from_attributes=True)


@router.post("/{review_id}/reply", summary="Ответ владельца/админа на отзыв")
async def reply_review(
    review_id: int,
    db: DBDep,
    admin_id: AdminDep,
    data: ReviewReply = Body(...),
):
    review = await db.reviews.get_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    updated = await db.reviews.set_reply(review_id=review_id, reply_text=data.owner_reply)
    await db.commit()
    return ReviewOut.model_validate(updated, from_attributes=True)