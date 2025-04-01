from sqlalchemy import insert, select, update, delete

from src.models.hotels import HotelsOrm
from src.repositories.base import BaseRepository
from pydantic import BaseModel

class HotelsRepository(BaseRepository):
    model = HotelsOrm
    async def get_all(self,location,title,limit,offset):
            query = select(self.model)
            if id:
                query = query.filter_by(id=id)
            if title:
                query = query.filter_by(title=title)
            if location:
                query = query.filter(self.model.location.ilike(f"%{location}%"))
            query = (
                query
                .limit(limit)
                .offset(offset)
            )

            result = await self.session.execute(query)
            hotels = result.scalars().all()
            return hotels

    async def add(self,data :BaseModel):
        add_data_stmt = insert(self.model).values(**data.model_dump()).returning(self.model)
        print(add_data_stmt.compile(compile_kwargs={"literal_binds": True}))
        result = await self.session.execute(add_data_stmt)
        return result.scalar_one()

    async def edit(self,data:BaseModel,**filter_by):
       try:
           query = select(self.model).filter_by(**filter_by)
           res = await self.session.execute(query)
           obj = res.scalars().first()
           if obj is None:
               return {'status': 'error', "message": "Объект не найден "}
           query = update(self.model).where(self.model.id == obj.id).values(**data.model_dump())
           await self.session.execute(query)
           return {"status":"success"}
       except Exception as e:
           await self.session.rollback()
           raise e


    async def delete(self, **filter_by):
        try:
            query = select(self.model).filter_by(**filter_by)
            res = await self.session.execute(query)
            obj = res.scalars().first()
            if obj is None:
                return {'status': 'error', "message": "Объект не найден "}
            query = delete(self.model).where(self.model.id == obj.id).returning(self.model)
            result = await self.session.execute(query)
            return result.scalar_one()
        except Exception as e:
            await self.session.rollback()
            raise e