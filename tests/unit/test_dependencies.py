import pytest
from fastapi import HTTPException
from starlette.requests import Request

from src.api.dependencies import get_token, get_current_user_id, admin_required
from src.services.auth import AuthService


def make_request(headers=None, cookies=None):
    headers = headers or {}
    cookies = cookies or {}
    scope = {
        'type': 'http',
        'headers': [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    request = Request(scope)
    request._cookies = cookies
    return request


def test_get_token_from_cookie(user_token):
    request = make_request(cookies={'access_token': user_token})
    assert get_token(request) == user_token


def test_get_token_from_authorization_header(user_token):
    request = make_request(headers={'Authorization': f'Bearer {user_token}'})
    assert get_token(request) == user_token


def test_get_token_without_credentials_raises_401():
    request = make_request()
    with pytest.raises(HTTPException) as exc:
        get_token(request)
    assert exc.value.status_code == 401
    assert exc.value.detail == 'Not authenticated'


def test_get_current_user_id_from_valid_token(user_token):
    assert get_current_user_id(user_token) == 2


@pytest.mark.asyncio
async def test_admin_required_allows_admin(fake_db):
    assert await admin_required(1, fake_db) == 1


@pytest.mark.asyncio
async def test_admin_required_rejects_regular_user(fake_db):
    with pytest.raises(HTTPException) as exc:
        await admin_required(2, fake_db)
    assert exc.value.status_code == 403
    assert 'Недостаточно прав' in exc.value.detail


