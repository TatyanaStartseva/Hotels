from typing import Annotated
from pydantic import BaseModel
from fastapi import Query, Depends, Request, HTTPException

from src.database import async_session_maker
from src.services.auth import AuthService
from src.utils.db_manager import DBManager


class Pagination(BaseModel):
    page: Annotated[int | None, Query(1, ge=1)]
    per_page: Annotated[int | None, Query(None, ge=1, lt=30)]


PaginationDep = Annotated[Pagination, Depends()]


def get_token(request: Request) -> str:
    # 1. Пробуем взять токен из cookie
    token = request.cookies.get("access_token")

    # 2. Если нет в cookie — пробуем из заголовка Authorization: Bearer xxx
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return token


def get_current_user_id(token: str = Depends(get_token)) -> int:
    data = AuthService().decode_token(token)
    return data["user_id"]


async def get_db():
    async with DBManager(session_factory=async_session_maker) as db:
        yield db


UserIdDep = Annotated[int, Depends(get_current_user_id)]
DBDep = Annotated[DBManager, Depends(get_db)]
