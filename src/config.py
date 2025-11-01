from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
class Settings(BaseSettings):
    DB_NAME: str # валиадация данных из env, усли получим не строку, то будет ошибка
    DB_HOST:str
    DB_PORT :int
    DB_USER :str
    DB_PASS:str
    AMADEUS_KEY:str
    AMADEUS_SECRET :str
    OFFERS_TTL_MINUTES:int
    @property
    def DB_URL(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    JWT_SECRET_KEY : str
    JWT_ALGORITHM : str
    ACCESS_TOKEN_EXPIRE_MINUTES :int
    #считывает переменные окружения из файла env
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        env_file_encoding="utf-8",
    )
settings = Settings()