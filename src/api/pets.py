from fastapi import APIRouter, HTTPException
from src.api.dependencies import DBDep, UserIdDep
from src.schemas.pets import PetAddRequest, PetAdd, PetUpdate

router = APIRouter(prefix="/pets", tags=["Питомцы"])


@router.get("/me")
async def get_my_pets(user_id: UserIdDep, db: DBDep):
    return await db.pets.get_filtered(user_id=user_id)


@router.post("")
async def create_pet(user_id: UserIdDep, db: DBDep, data: PetAddRequest):
    # базовые валидации
    if data.temperature_min is not None and data.temperature_max is not None:
        if data.temperature_min > data.temperature_max:
            raise HTTPException(422, "temperature_min > temperature_max")
    if data.humidity_min is not None and data.humidity_max is not None:
        if data.humidity_min > data.humidity_max:
            raise HTTPException(422, "humidity_min > humidity_max")
    if data.feedings_per_day is not None and data.feedings_per_day < 1:
        raise HTTPException(422, "feedings_per_day must be >= 1")
    if data.license_required and not data.license_number:
        raise HTTPException(422, "license_number is required when license_required=true")

    pet = await db.pets.add(PetAdd(user_id=user_id, **data.model_dump()))
    await db.commit()
    return {"status": "OK", "data": pet}


@router.patch("/{pet_id}")
async def update_pet(user_id: UserIdDep, db: DBDep, pet_id: int, data: PetUpdate):
    pet = await db.pets.get_one_or_none(id=pet_id)
    if not pet or pet.user_id != user_id:
        raise HTTPException(404, "Pet not found")

    # в edit используем exclude_unset=True чтобы обновлять только переданные поля
    await db.pets.edit(data, exclude_unset=True, id=pet_id)
    await db.commit()
    return {"status": "OK"}


@router.delete("/{pet_id}")
async def delete_pet(user_id: UserIdDep, db: DBDep, pet_id: int):
    pet = await db.pets.get_one_or_none(id=pet_id)
    if not pet or pet.user_id != user_id:
        raise HTTPException(404, "Pet not found")

    await db.pets.delete(id=pet_id)
    await db.commit()
    return {"status": "OK"}
