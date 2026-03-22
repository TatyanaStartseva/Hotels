from fastapi import APIRouter, Body, HTTPException
from src.api.dependencies import DBDep, UserIdDep, AdminDep
from src.schemas.ads import AdCreate, AdOut, AdStatsOut
from src.services.ads import weight_by_plan

router = APIRouter(prefix="/ads", tags=["Реклама"])


@router.post("", response_model=AdOut)
async def create_ad(
    db: DBDep,
    user_id: UserIdDep,
    payload: AdCreate = Body(...),
):
    weight = weight_by_plan(payload.plan_name)

    obj = await db.ads.add({
        "owner_id": user_id,
        "title": payload.title,
        "description": payload.description,
        "image_url": payload.image_url,
        "target_url": payload.target_url,
        "is_active": payload.is_active,
        "plan_name": payload.plan_name,
        "weight": weight,
    })
    await db.commit()
    return AdOut.model_validate(obj, from_attributes=True)


@router.get("/random", response_model=AdOut | None)
async def get_random_ad(db: DBDep):
    ad = await db.ads.get_weighted_random()
    if not ad:
        return None

    await db.ads.add_impression(ad.id)
    await db.commit()
    return AdOut.model_validate(ad, from_attributes=True)


@router.post("/{ad_id}/click")
async def register_click(ad_id: int, db: DBDep):
    await db.ads.add_click(ad_id)
    await db.commit()
    return {"status": "ok"}


@router.get("/stats", response_model=list[AdStatsOut])
async def ads_stats(db: DBDep, admin_id: AdminDep):
    rows = await db.ads.stats()
    result = []
    for row in rows:
        impressions = int(row.impressions or 0)
        clicks = int(row.clicks or 0)
        ctr = round((clicks / impressions * 100), 2) if impressions > 0 else 0.0
        result.append(
            AdStatsOut(
                ad_id=row.ad_id,
                title=row.title,
                impressions=impressions,
                clicks=clicks,
                ctr_percent=ctr,
            )
        )
    return result