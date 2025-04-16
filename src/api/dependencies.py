from typing import Annotated
from pydantic import BaseModel
from fastapi import  Query, Depends, Request,HTTPException
from pyexpat.errors import messages

from src.services.auth import AuthService


class Pagination(BaseModel):
    page: Annotated[int | None , Query(1, ge=1)]
    per_page: Annotated[int | None, Query(None, ge=1, lt=30)]

PaginationDep = Annotated[Pagination,Depends()]
def get_token(request:Request)->str:
    token=  request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail='Вы не предоставили токен')
    return token

def get_current_user_id(token: str =Depends(get_token))->int:
    data = AuthService().decode_token(token)
    print(token)
    return data["user_id"]

UserIdDep = Annotated[int,Depends(get_current_user_id)]