from typing import Annotated
from pydantic import BaseModel
from fastapi import  Query, Depends

class Pagination(BaseModel):
    page: Annotated[int | None , Query(None, ge=1)]
    per_page: Annotated[int | None, Query(None, ge=1, lt=30)]

PaginationDep = Annotated[Pagination,Depends()]