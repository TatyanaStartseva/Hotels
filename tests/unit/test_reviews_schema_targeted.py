from datetime import datetime

import pytest
from pydantic import ValidationError

from src.schemas.reviews import ReviewAdd, ReviewOut, ReviewReply

@pytest.mark.parametrize(
    "rating",
    [1, 3, 5]
)
def test_review_add_accepts_valid_rating(rating):
    review = ReviewAdd(
        booking_id=1,
        rating=rating,
        text='Ок'
    )

    assert review.rating == rating

@pytest.mark.parametrize(
    "rating",
    [0, -1, 6]
)
def test_review_add_rejects_invalid_rating(rating):
    with pytest.raises(ValidationError):
        ReviewAdd(
            booking_id=1,
            rating=rating,
            text='Тест'
        )


@pytest.mark.parametrize(
    "text",
    [
        "",
        "o",
    ]
)
def test_review_add_rejects_too_short_text(text):
    with pytest.raises(ValidationError):
        ReviewAdd(booking_id=1, rating=5, text=text)


@pytest.mark.parametrize(
    "text",
    [
        "окок",
        "Норм",
        "Хорошо",
    ]
)
def test_review_add_accepts_valid_text(text):
    review = ReviewAdd(booking_id=1, rating=5, text=text)
    assert review.text == text

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
