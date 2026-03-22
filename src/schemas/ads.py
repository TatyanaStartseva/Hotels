from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AdCreate(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    target_url: str | None = None
    is_active: bool = True
    plan_name: str = "basic"


class AdPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    target_url: str | None = None
    is_active: bool | None = None
    plan_name: str | None = None


class AdOut(BaseModel):
    id: int
    owner_id: int | None
    title: str
    description: str | None
    image_url: str | None
    target_url: str | None
    is_active: bool
    plan_name: str
    weight: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdStatsOut(BaseModel):
    ad_id: int
    title: str
    impressions: int
    clicks: int
    ctr_percent: float