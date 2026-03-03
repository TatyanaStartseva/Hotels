from src.repositories.base import BaseRepository
from src.models.pets import PetsOrm
from src.schemas.pets import Pet


class PetsRepository(BaseRepository):
    model = PetsOrm
    schema = Pet
