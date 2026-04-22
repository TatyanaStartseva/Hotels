from fastapi import APIRouter, HTTPException
from src.api.dependencies import DBDep, AdminDep

router = APIRouter(prefix="/admin/users", tags=["Администрирование пользователей"])

@router.patch("/{user_id}/grant-hotel-owner")
async def grant_hotel_owner(user_id: int, db: DBDep, admin_id: AdminDep):
    user = await db.users.get_one_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.edit({"is_hotel_owner": True}, id=user_id)
    await db.commit()
    return {"status": "ok"}

@router.patch("/{user_id}/revoke-hotel-owner")
async def revoke_hotel_owner(user_id: int, db: DBDep, admin_id: AdminDep):
    user = await db.users.get_one_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.edit({"is_hotel_owner": False}, id=user_id)
    await db.commit()
    return {"status": "ok"}