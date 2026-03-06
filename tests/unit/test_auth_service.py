from datetime import datetime, timezone

import jwt
import pytest
from fastapi import HTTPException

from src.services.auth import AuthService


def test_hash_password_and_verify_success(auth_service):
    hashed = auth_service.hash_password('secret123')
    assert hashed != 'secret123'
    assert auth_service.verify_password('secret123', hashed) is True


def test_verify_password_rejects_wrong_password(auth_service):
    hashed = auth_service.hash_password('secret123')
    assert auth_service.verify_password('wrong', hashed) is False


def test_create_access_token_contains_user_id(auth_service):
    token = auth_service.create_access_token({'user_id': 7})
    payload = auth_service.decode_token(token)
    assert payload['user_id'] == 7
    assert 'exp' in payload


def test_decode_token_invalid_token_raises_http_401(auth_service):
    with pytest.raises(HTTPException) as exc:
        auth_service.decode_token('definitely-not-a-jwt')
    assert exc.value.status_code == 401
    assert 'Неверный токен' in exc.value.detail


def test_created_token_has_future_expiration(auth_service):
    token = auth_service.create_access_token({'user_id': 1})
    payload = jwt.decode(token, options={'verify_signature': False})
    assert payload['exp'] > datetime.now(timezone.utc).timestamp()


def test_decode_token_returns_payload_for_valid_token(auth_service):
    token = auth_service.create_access_token({'user_id': 5, 'role': 'admin'})
    payload = auth_service.decode_token(token)
    assert payload['user_id'] == 5
    assert payload['role'] == 'admin'


def test_create_access_token_preserves_extra_claims(auth_service):
    token = auth_service.create_access_token({'user_id': 9, 'scope': 'read:all'})
    payload = auth_service.decode_token(token)
    assert payload['scope'] == 'read:all'


def test_hash_password_is_salted(auth_service):
    first = auth_service.hash_password('same-password')
    second = auth_service.hash_password('same-password')
    assert first != second
    assert auth_service.verify_password('same-password', first)
    assert auth_service.verify_password('same-password', second)