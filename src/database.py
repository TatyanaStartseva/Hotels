import asyncio

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from sqlalchemy import text
from src.config import settings

engine = create_async_engine(settings.DB_URL)

async def func():
    async with engine.begin() as conn:
        res = await conn.execute(text("select version()"))
        print(res.fetchone())

asyncio.run(func())