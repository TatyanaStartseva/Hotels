from src.models.users import UsersOrm
from src.repositories.base import BaseRepository
from src.schemas.users import User


class UsersRepositories(BaseRepository):
    model = UsersOrm
    schema = User