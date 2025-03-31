from src.models.rooms import RoomsOrm
from src.repositories.base import BaseRepository


class RoomsRepositories(BaseRepository):
    model = RoomsOrm