from fastapi import APIRouter
from passlib.context import CryptContext
from src.database import async_session_maker
from src.repositories.users import UsersRepositories
from src.schemas.users import UsersRequestAdd, UserAdd

router = APIRouter(prefix='/auth',tags=['Авторизация и аутенфикация'] )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
async def register_user(data: UsersRequestAdd):
    hashed_password = pwd_context.hash(data.password)
    new_user_data = UserAdd(email=data.email,hashed_password=hashed_password)
    async with async_session_maker() as session:
        await UsersRepositories(session).add(new_user_data)
        await session.comit()
    return {'status': "ok"}
