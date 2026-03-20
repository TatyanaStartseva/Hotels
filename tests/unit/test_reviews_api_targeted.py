from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from src.api import reviews as reviews_api
from src.schemas.reviews import ReviewAdd, ReviewReply


@pytest.mark.asyncio
async def test_list_reviews_delegates_to_repository():
    expected = [SimpleNamespace(id=1), SimpleNamespace(id=2)]
    db = SimpleNamespace(reviews=SimpleNamespace(list_by_hotel=AsyncMock(return_value=expected)))

    result = await reviews_api.list_reviews(db=db, hotel_id=10, limit=5, offset=2)

    assert result == expected
    db.reviews.list_by_hotel.assert_awaited_once_with(hotel_id=10, limit=5, offset=2)


@pytest.mark.asyncio
async def test_create_review_returns_404_when_booking_missing():
    db = SimpleNamespace(
        bookings=SimpleNamespace(get_by_id=AsyncMock(return_value=None)),
        rooms=SimpleNamespace(get_room=AsyncMock()),
        reviews=SimpleNamespace(create=AsyncMock()),
        commit=AsyncMock(),
    )

    with pytest.raises(HTTPException) as exc:
        await reviews_api.create_review(
            db=db,
            user_id=2,
            data=ReviewAdd(booking_id=10, rating=5, text='Отличный отель'),
        )

    assert exc.value.status_code == 404
    assert 'Бронь не найдена' in exc.value.detail
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_review_returns_403_when_booking_belongs_to_another_user():
    db = SimpleNamespace(
        bookings=SimpleNamespace(get_by_id=AsyncMock(return_value=SimpleNamespace(id=10, user_id=99, room_id=7))),
        rooms=SimpleNamespace(get_room=AsyncMock()),
        reviews=SimpleNamespace(create=AsyncMock()),
        commit=AsyncMock(),
    )

    with pytest.raises(HTTPException) as exc:
        await reviews_api.create_review(
            db=db,
            user_id=2,
            data=ReviewAdd(booking_id=10, rating=4, text='Нормально'),
        )

    assert exc.value.status_code == 403
    assert 'не ваша бронь' in exc.value.detail
    db.rooms.get_room.assert_not_awaited()
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_review_returns_404_when_room_missing():
    db = SimpleNamespace(
        bookings=SimpleNamespace(get_by_id=AsyncMock(return_value=SimpleNamespace(id=10, user_id=2, room_id=7))),
        rooms=SimpleNamespace(get_room=AsyncMock(return_value=None)),
        reviews=SimpleNamespace(create=AsyncMock()),
        commit=AsyncMock(),
    )

    with pytest.raises(HTTPException) as exc:
        await reviews_api.create_review(
            db=db,
            user_id=2,
            data=ReviewAdd(booking_id=10, rating=5, text='Очень понравилось'),
        )

    assert exc.value.status_code == 404
    assert 'Комната не найдена' in exc.value.detail
    db.reviews.create.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_review_success_uses_room_hotel_id_and_commits():
    review_obj = SimpleNamespace(
        id=1,
        hotel_id=77,
        user_id=2,
        booking_id=10,
        rating=5,
        text='Супер сервис',
        created_at='2026-03-20T10:00:00',
        owner_reply=None,
        owner_reply_at=None,
    )
    db = SimpleNamespace(
        bookings=SimpleNamespace(get_by_id=AsyncMock(return_value=SimpleNamespace(id=10, user_id=2, room_id=7))),
        rooms=SimpleNamespace(get_room=AsyncMock(return_value=SimpleNamespace(id=7, hotel_id=77))),
        reviews=SimpleNamespace(create=AsyncMock(return_value=review_obj)),
        commit=AsyncMock(),
    )

    result = await reviews_api.create_review(
        db=db,
        user_id=2,
        data=ReviewAdd(booking_id=10, rating=5, text='Супер сервис'),
    )

    assert result.hotel_id == 77
    assert result.booking_id == 10
    assert result.rating == 5
    db.reviews.create.assert_awaited_once_with(
        hotel_id=77,
        user_id=2,
        booking_id=10,
        rating=5,
        text='Супер сервис',
    )
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_reply_review_returns_404_when_review_missing():
    db = SimpleNamespace(
        reviews=SimpleNamespace(get_by_id=AsyncMock(return_value=None), set_reply=AsyncMock()),
        commit=AsyncMock(),
    )

    with pytest.raises(HTTPException) as exc:
        await reviews_api.reply_review(
            review_id=5,
            db=db,
            admin_id=1,
            data=ReviewReply(owner_reply='Спасибо за отзыв'),
        )

    assert exc.value.status_code == 404
    assert 'Отзыв не найден' in exc.value.detail
    db.reviews.set_reply.assert_not_awaited()
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_reply_review_success_updates_reply_and_commits():
    updated = SimpleNamespace(
        id=5,
        hotel_id=1,
        user_id=2,
        booking_id=10,
        rating=4,
        text='Хорошо',
        created_at='2026-03-20T10:00:00',
        owner_reply='Спасибо!',
        owner_reply_at='2026-03-20T11:00:00',
    )
    db = SimpleNamespace(
        reviews=SimpleNamespace(
            get_by_id=AsyncMock(return_value=SimpleNamespace(id=5)),
            set_reply=AsyncMock(return_value=updated),
        ),
        commit=AsyncMock(),
    )

    result = await reviews_api.reply_review(
        review_id=5,
        db=db,
        admin_id=1,
        data=ReviewReply(owner_reply='Спасибо!'),
    )

    assert result.owner_reply == 'Спасибо!'
    db.reviews.set_reply.assert_awaited_once_with(review_id=5, reply_text='Спасибо!')
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_reply_review_returns_model_from_updated_entity():
    updated = SimpleNamespace(
        id=9,
        hotel_id=2,
        user_id=3,
        booking_id=11,
        rating=3,
        text='Средне',
        created_at='2026-03-20T10:00:00',
        owner_reply='Приняли к сведению',
        owner_reply_at='2026-03-20T12:00:00',
    )
    db = SimpleNamespace(
        reviews=SimpleNamespace(
            get_by_id=AsyncMock(return_value=SimpleNamespace(id=9)),
            set_reply=AsyncMock(return_value=updated),
        ),
        commit=AsyncMock(),
    )

    result = await reviews_api.reply_review(
        review_id=9,
        db=db,
        admin_id=1,
        data=ReviewReply(owner_reply='Приняли к сведению'),
    )

    assert result.id == 9
    assert result.text == 'Средне'
