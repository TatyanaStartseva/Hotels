from gc import set_debug
from pydantic import BaseModel
from sqlalchemy import select, insert, update, delete


class BaseRepository:
    model = None
    schema: BaseModel = None

    def __init__(self,session ):
        self.session = session

    async def get_all(self):
            query = select(self.model)
            result = await self.session.execute(query)
            return [self.schema.model_validate(model, from_attributes=True ) for model in result.scalars().all()]


    async def get_one_or_none(self, **filter_by):
        query = select(self.model).filter_by(**filter_by)
        result = await self.session.execute(query)
        model = result.scalars().one_or_none()
        if model is None:
            return None
        return self.schema.model_validate(model, from_attributes=True)

    async def add(self, data: BaseModel):
        add_data_stmt = insert(self.model).values(**data.model_dump()).returning(self.model)
        print(add_data_stmt.compile(compile_kwargs={"literal_binds": True}))
        result = await self.session.execute(add_data_stmt)
        model= result.scalar_one()
        return self.schema.model_validate(model, from_attributes=True)

    async def edit(self,data:BaseModel,exclude_unset:bool = False, **filter_by):
       try:
           query = select(self.model).filter_by(**filter_by)
           res = await self.session.execute(query)
           obj = res.scalars().first()
           if obj is None:
               return {'status': 'error', "message": "Объект не найден "}
           query = update(self.model).where(self.model.id == obj.id).values(**data.model_dump(exclude_unset=exclude_unset))
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