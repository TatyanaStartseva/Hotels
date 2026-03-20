from datetime import datetime

import pytest
from pydantic import ValidationError

from src.schemas.reviews import ReviewAdd, ReviewOut, ReviewReply


def test_review_add_accepts_boundary_rating_values():
    low = ReviewAdd(booking_id=1, rating=1, text='Норм')
    high = ReviewAdd(booking_id=2, rating=5, text='Отлично')

    assert low.rating == 1
    assert high.rating == 5


def test_review_add_rejects_rating_below_minimum():
    with pytest.raises(ValidationError):
        ReviewAdd(booking_id=1, rating=0, text='Плохо')


def test_review_add_rejects_rating_above_maximum():
    with pytest.raises(ValidationError):
        ReviewAdd(booking_id=1, rating=6, text='Слишком хорошо')


def test_review_add_rejects_too_short_text():
    with pytest.raises(ValidationError):
        ReviewAdd(booking_id=1, rating=5, text='ok')


def test_review_reply_rejects_empty_string():
    with pytest.raises(ValidationError):
        ReviewReply(owner_reply='')


def test_review_out_can_be_built_from_attributes():
    obj = type('ReviewObj', (), {
        'id': 5,
        'hotel_id': 1,
        'user_id': 2,
        'booking_id': 10,
        'rating': 4,
        'text': 'Хорошо',
        'created_at': datetime(2026, 3, 20, 10, 0, 0),
        'owner_reply': 'Спасибо',
        'owner_reply_at': datetime(2026, 3, 20, 11, 0, 0),
    })()

    result = ReviewOut.model_validate(obj, from_attributes=True)

    assert result.id == 5
    assert result.owner_reply == 'Спасибо'
