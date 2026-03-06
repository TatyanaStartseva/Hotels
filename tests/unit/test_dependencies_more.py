import pytest
from fastapi import HTTPException
from jwt import ExpiredSignatureError, InvalidTokenError

from src.api.dependencies import admin_required, get_current_user_id, get_token
from src.services.auth import AuthService
from tests.unit.test_dependencies import make_request


def test_get_token_prefers_cookie_over_header(user_token):
    request = make_request(
        headers={'Authorization': 'Bearer header-token'},
        cookies={'access_token': user_token},
    )
    assert get_token(request) == user_token


def test_get_current_user_id_expired_token_raises_401(monkeypatch):
    monkeypatch.setattr(AuthService, 'decode_token', lambda self, token: (_ for _ in ()).throw(ExpiredSignatureError('expired')))
    with pytest.raises(HTTPException) as exc:
        get_current_user_id('expired-token')
    assert exc.value.status_code == 401
    assert exc.value.detail == 'Token expired'


def test_get_current_user_id_invalid_token_raises_401(monkeypatch):
    monkeypatch.setattr(AuthService, 'decode_token', lambda self, token: (_ for _ in ()).throw(InvalidTokenError('bad')))
    with pytest.raises(HTTPException) as exc:
        get_current_user_id('bad-token')
    assert exc.value.status_code == 401
    assert exc.value.detail == 'Invalid token'


@pytest.mark.asyncio
async def test_admin_required_rejects_missing_user(fake_db):
    with pytest.raises(HTTPException) as exc:
        await admin_required(999, fake_db)
    assert exc.value.status_code == 403
    assert 'Недостаточно прав' in exc.value.detail
