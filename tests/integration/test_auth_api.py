import pytest


def test_register_user_success(client, fake_db):
    response = client.post('/auth/register', json={'email': 'new@example.com', 'password': 'secret123'})
    assert response.status_code == 200
    assert response.json() == {'status': 'OK'}
    assert any(user.email == 'new@example.com' for user in fake_db.users_store.values())
    assert fake_db.committed is True


def test_register_duplicate_email_returns_409(client):
    response = client.post('/auth/register', json={'email': 'admin@example.com', 'password': 'secret123'})

    assert response.status_code == 409
    assert  response.json()['detail']


def test_login_success_sets_cookie_and_returns_token(client):
    response = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'userpass'})
    assert response.status_code == 200
    body = response.json()
    assert 'access_token' in body
    assert 'access_token=' in response.headers['set-cookie']


def test_login_unknown_user_returns_401(client):
    response = client.post('/auth/login', json={'email': 'missing@example.com', 'password': 'x'})
    assert response.status_code == 401
    assert 'не зарегистрирован' in response.json()['detail']


def test_login_wrong_password_returns_401(client):
    response = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'wrong'})
    assert response.status_code == 401
    assert 'Пароль неверный' in response.json()['detail']


def test_logout_deletes_cookie(client):
    response = client.post('/auth/logout')
    assert response.status_code == 200
    assert response.json() == {'status': 200}
    assert 'access_token=""' in response.headers['set-cookie']


def test_me_returns_current_user(client, auth_headers):
    response = client.get('/auth/me', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['email'] == 'user@example.com'


def test_me_requires_authentication(client):
    response = client.get('/auth/me')
    assert response.status_code == 401