from fastapi import APIRouter, Body, HTTPException
from src.api.dependencies import DBDep, UserIdDep, AdminDep
from src.schemas.ads import AdCreate, AdOut, AdStatsOut, AdPatch
from src.services.ads import weight_by_plan

router = APIRouter(prefix="/ads", tags=["Реклама"])


@router.post("", response_model=AdOut)
async def create_ad(
    db: DBDep,
    admin_id: AdminDep,
    payload: AdCreate = Body(...),
):
    weight = weight_by_plan(payload.plan_name)

    obj = await db.ads.create_ad(
        owner_id=admin_id,
        title=payload.title,
        description=payload.description,
        image_url=payload.image_url,
        target_url=payload.target_url,
        is_active=payload.is_active,
        plan_name=payload.plan_name,
        weight=weight,
    )
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
@router.get("", response_model=list[AdOut])
async def get_ads(db: DBDep, admin_id: AdminDep):
    ads = await db.ads.get_all_ads()
    return [AdOut.model_validate(x, from_attributes=True) for x in ads]


@router.patch("/{ad_id}", response_model=AdOut)
async def patch_ad(
    ad_id: int,
    payload: AdPatch,
    db: DBDep,
    admin_id: AdminDep,
):
    data = payload.model_dump(exclude_unset=True)

    if "plan_name" in data:
        data["weight"] = weight_by_plan(data["plan_name"])

    obj = await db.ads.update_ad(ad_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Реклама не найдена")

    await db.commit()
    return AdOut.model_validate(obj, from_attributes=True)


@router.delete("/{ad_id}")
async def delete_ad(ad_id: int, db: DBDep, admin_id: AdminDep):
    ok = await db.ads.delete_ad(ad_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Реклама не найдена")

    await db.commit()
    return {"status": "ok"}