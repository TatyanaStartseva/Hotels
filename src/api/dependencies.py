from typing import Annotated
from fastapi import Depends, HTTPException, Request, Query
from pydantic import BaseModel

from src.database import async_session_maker
from src.services.auth import AuthService
from src.utils.db_manager import DBManager


async def get_db():
    async with DBManager(session_factory=async_session_maker) as db:
        yield db


DBDep = Annotated[DBManager, Depends(get_db)]


class PaginationParams(BaseModel):
    page: int = 1
    per_page: int = 5


def get_pagination(
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, per_page=per_page)


PaginationDep = Annotated[PaginationParams, Depends(get_pagination)]


def get_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]

    token = request.cookies.get("access_token")
    if token:
        return token

    raise HTTPException(status_code=401, detail="Токен отсутствует")


async def get_current_user_id(token: str = Depends(get_token)) -> int:
    data = AuthService().decode_token(token)
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Некорректный токен")
    return int(user_id)


UserIdDep = Annotated[int, Depends(get_current_user_id)]


async def get_admin_user_id(user_id: UserIdDep, db: DBDep) -> int:
    user = await db.users.get_one_or_none(id=user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав администратора")
    return user_id


AdminDep = Annotated[int, Depends(get_admin_user_id)]


async def get_hotel_owner_user_id(user_id: UserIdDep, db: DBDep) -> int:
    user = await db.users.get_one_or_none(id=user_id)
    if not user or not (user.is_admin or getattr(user, "is_hotel_owner", False)):
        raise HTTPException(status_code=403, detail="Недостаточно прав владельца отеля")
    return user_id


HotelOwnerDep = Annotated[int, Depends(get_hotel_owner_user_id)]


async def ensure_hotel_owner_or_admin(hotel_id: int, user_id: int, db: DBDep):
    hotel = await db.hotels.get_one_or_none(id=hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    user = await db.users.get_one_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.is_admin:
        return hotel

    if not getattr(user, "is_hotel_owner", False):
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    if hotel.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Это не ваш отель")

    return hotel