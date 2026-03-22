import random
from sqlalchemy import select, update, func
from src.repositories.base import BaseRepository
from src.models.ads import AdsOrm
from src.models.ad_impressions import AdImpressionOrm
from src.models.ad_clicks import AdClickOrm
from src.schemas.ads import AdOut


class AdsRepository(BaseRepository):
    model = AdsOrm
    schema = AdOut

    async def get_active_ads(self):
        q = select(self.model).where(self.model.is_active == True)
        res = await self.session.execute(q)
        return res.scalars().all()

    async def get_weighted_random(self):
        ads = await self.get_active_ads()
        if not ads:
            return None
        weights = [max(1, ad.weight) for ad in ads]
        return random.choices(ads, weights=weights, k=1)[0]

    async def add_impression(self, ad_id: int):
        obj = AdImpressionOrm(ad_id=ad_id)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def add_click(self, ad_id: int):
        obj = AdClickOrm(ad_id=ad_id)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def stats(self):
        q = (
            select(
                AdsOrm.id.label("ad_id"),
                AdsOrm.title,
                func.count(func.distinct(AdImpressionOrm.id)).label("impressions"),
                func.count(func.distinct(AdClickOrm.id)).label("clicks"),
            )
            .select_from(AdsOrm)
            .outerjoin(AdImpressionOrm, AdImpressionOrm.ad_id == AdsOrm.id)
            .outerjoin(AdClickOrm, AdClickOrm.ad_id == AdsOrm.id)
            .group_by(AdsOrm.id, AdsOrm.title)
            .order_by(AdsOrm.id)
        )
        res = await self.session.execute(q)
        return res.all()