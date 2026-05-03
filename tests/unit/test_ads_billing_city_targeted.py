from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.api import ads as ads_api
from src.api import billing as billing_api
from src.schemas.ads import AdCreate, AdPatch
from src.services.ads import weight_by_plan


class FakeAdsRepo:
    def __init__(self):
        self.items = {
            1: SimpleNamespace(
                id=1,
                owner_id=1,
                title="Old",
                description="desc",
                image_url=None,
                target_url=None,
                is_active=True,
                plan_name="basic",
                weight=1,
                created_at=datetime(2026, 1, 1),
            )
        }
        self.last_add_payload = None
        self.updated = []
        self.deleted = []
        self.impressions = []
        self.clicks = []
        self.stats_rows = []
        self.random_ad = None

    async def add(self, payload):
        self.last_add_payload = payload
        obj = SimpleNamespace(
            id=2,
            created_at=datetime(2026, 1, 2),
            **payload,
        )
        self.items[obj.id] = obj
        return obj

    async def get_weighted_random(self):
        return self.random_ad

    async def add_impression(self, ad_id):
        self.impressions.append(ad_id)

    async def add_click(self, ad_id):
        self.clicks.append(ad_id)

    async def stats(self):
        return self.stats_rows

    async def get_all_ads(self):
        return list(self.items.values())

    async def update_ad(self, ad_id, data):
        self.updated.append((ad_id, data))
        obj = self.items.get(ad_id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        return obj

    async def delete_ad(self, ad_id):
        self.deleted.append(ad_id)
        return ad_id in self.items
    async def create_ad(
        self,
        owner_id,
        title,
        description,
        image_url,
        target_url,
        is_active,
        plan_name,
        weight,
    ):
        payload = {
            "owner_id": owner_id,
            "title": title,
            "description": description,
            "image_url": image_url,
            "target_url": target_url,
            "is_active": is_active,
            "plan_name": plan_name,
            "weight": weight,
        }

        self.last_add_payload = payload

        obj = SimpleNamespace(
            id=2,
            created_at=datetime(2026, 1, 2),
            **payload,
        )

        self.items[obj.id] = obj

        return obj

class FakeUsersRepo:
    def __init__(self, users):
        self.users_by_id = {u.id: u for u in users}
        self.edit_calls = []
        self.lookup_by_subscription = {u.provider_subscription_id: u for u in users if getattr(u, 'provider_subscription_id', None)}
        self.lookup_by_customer = {u.provider_customer_id: u for u in users if getattr(u, 'provider_customer_id', None)}

    async def get_one_or_none(self, **kwargs):
        if 'id' in kwargs:
            return self.users_by_id.get(kwargs['id'])
        if 'provider_subscription_id' in kwargs:
            return self.lookup_by_subscription.get(kwargs['provider_subscription_id'])
        if 'provider_customer_id' in kwargs:
            return self.lookup_by_customer.get(kwargs['provider_customer_id'])
        return None

    async def edit(self, data, **kwargs):
        self.edit_calls.append((data, kwargs))
        user = None
        if 'id' in kwargs:
            user = self.users_by_id.get(kwargs['id'])
        if user:
            for key, value in data.items():
                setattr(user, key, value)
            if 'provider_subscription_id' in data:
                self.lookup_by_subscription[data['provider_subscription_id']] = user
            if 'provider_customer_id' in data:
                self.lookup_by_customer[data['provider_customer_id']] = user
        return {"status": "success"}


class FakeDB:
    def __init__(self, *, ads=None, users=None):
        self.ads = ads or FakeAdsRepo()
        self.users = users or FakeUsersRepo([])
        self.commits = 0

    async def commit(self):
        self.commits += 1


class FakeRequest:
    def __init__(self, payload=b"{}", signature="sig"):
        self._payload = payload
        self.headers = {"stripe-signature": signature}

    async def body(self):
        return self._payload


@pytest.mark.parametrize(
    ('plan_name', 'expected_weight'),
    [
        ('basic', 1),
        ('premium', 3),
        ('vip', 8),
        ('unknown', 1),
    ],
)
def test_weight_by_plan_cases(plan_name, expected_weight):
    assert weight_by_plan(plan_name) == expected_weight



@pytest.mark.asyncio
async def test_create_ad_sets_weight_and_commits():
    db = FakeDB(ads=FakeAdsRepo())

    result = await ads_api.create_ad(
        db=db,
        admin_id=99,
        payload=AdCreate(title='Banner', plan_name='vip', description='promo'),
    )

    assert result.title == 'Banner'
    assert result.owner_id == 99
    assert result.weight == 8
    assert db.ads.last_add_payload['plan_name'] == 'vip'
    assert db.ads.last_add_payload['weight'] == 8
    assert db.commits == 1


@pytest.mark.asyncio
async def test_get_random_ad_adds_impression_when_found():
    ads_repo = FakeAdsRepo()
    ads_repo.random_ad = ads_repo.items[1]
    db = FakeDB(ads=ads_repo)

    result = await ads_api.get_random_ad(db=db)

    assert result.id == 1
    assert ads_repo.impressions == [1]
    assert db.commits == 1


@pytest.mark.asyncio
async def test_get_random_ad_returns_none_without_commit_when_not_found():
    ads_repo = FakeAdsRepo()
    db = FakeDB(ads=ads_repo)

    result = await ads_api.get_random_ad(db=db)

    assert result is None
    assert ads_repo.impressions == []
    assert db.commits == 0


@pytest.mark.asyncio
async def test_ads_stats_calculates_ctr_and_zero_division_case():
    ads_repo = FakeAdsRepo()
    ads_repo.stats_rows = [
        SimpleNamespace(ad_id=1, title='A', impressions=10, clicks=4),
        SimpleNamespace(ad_id=2, title='B', impressions=0, clicks=3),
    ]
    db = FakeDB(ads=ads_repo)

    result = await ads_api.ads_stats(db=db, admin_id=1)

    assert result[0].ctr_percent == 40.0
    assert result[1].ctr_percent == 0.0


@pytest.mark.asyncio
async def test_patch_ad_updates_weight_when_plan_changes():
    ads_repo = FakeAdsRepo()
    db = FakeDB(ads=ads_repo)

    result = await ads_api.patch_ad(
        ad_id=1,
        payload=AdPatch(plan_name='premium', title='Updated'),
        db=db,
        admin_id=1,
    )

    assert result.plan_name == 'premium'
    assert result.weight == 3
    assert ads_repo.updated[-1][1]['weight'] == 3
    assert db.commits == 1


@pytest.mark.asyncio
async def test_patch_ad_raises_404_when_ad_missing():
    db = FakeDB(ads=FakeAdsRepo())

    with pytest.raises(HTTPException) as exc:
        await ads_api.patch_ad(
            ad_id=999,
            payload=AdPatch(title='missing'),
            db=db,
            admin_id=1,
        )

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_ad_raises_404_when_missing():
    db = FakeDB(ads=FakeAdsRepo())

    with pytest.raises(HTTPException) as exc:
        await ads_api.delete_ad(ad_id=999, db=db, admin_id=1)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_register_click_commits_and_returns_ok():
    ads_repo = FakeAdsRepo()
    db = FakeDB(ads=ads_repo)

    result = await ads_api.register_click(ad_id=1, db=db)

    assert result == {'status': 'ok'}
    assert ads_repo.clicks == [1]
    assert db.commits == 1


@pytest.mark.asyncio
async def test_get_plans_contains_expected_codes():
    result = await billing_api.get_plans()
    assert {item['code'] for item in result} == {'basic', 'pro', 'premium'}


@pytest.mark.asyncio
async def test_get_my_subscription_returns_user_fields():
    user = SimpleNamespace(
        id=7,
        subscription_plan='premium',
        subscription_status='active',
        subscription_ends_at='2030-01-01',
        provider_customer_id=None,
        provider_subscription_id=None,
    )
    db = FakeDB(users=FakeUsersRepo([user]))

    result = await billing_api.get_my_subscription(user_id=7, db=db)

    assert result['plan'] == 'premium'
    assert result['status'] == 'active'
    assert result['ends_at'] == '2030-01-01'


@pytest.mark.asyncio
async def test_get_my_subscription_raises_404_for_missing_user():
    db = FakeDB(users=FakeUsersRepo([]))

    with pytest.raises(HTTPException) as exc:
        await billing_api.get_my_subscription(user_id=404, db=db)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_create_checkout_session_creates_customer_when_absent(monkeypatch):
    user = SimpleNamespace(
        id=5,
        email='user@example.com',
        provider_customer_id=None,
        provider_subscription_id=None,
        subscription_plan=None,
        subscription_status=None,
        subscription_ends_at=None,
    )
    users = FakeUsersRepo([user])
    db = FakeDB(users=users)

    monkeypatch.setattr(
        billing_api.stripe.Customer,
        'create',
        lambda **kwargs: SimpleNamespace(id='cus_new'),
    )
    monkeypatch.setattr(
        billing_api.stripe.checkout.Session,
        'create',
        lambda **kwargs: SimpleNamespace(url='https://checkout.example/session'),
    )

    result = await billing_api.create_checkout_session(plan_code='basic', user_id=5, db=db)

    assert result == {'checkout_url': 'https://checkout.example/session'}
    assert users.edit_calls[0][0]['provider_customer_id'] == 'cus_new'
    assert db.commits == 1


@pytest.mark.asyncio
async def test_create_checkout_session_uses_existing_customer_without_extra_commit(monkeypatch):
    user = SimpleNamespace(
        id=6,
        email='existing@example.com',
        provider_customer_id='cus_existing',
        provider_subscription_id=None,
        subscription_plan=None,
        subscription_status=None,
        subscription_ends_at=None,
    )
    users = FakeUsersRepo([user])
    db = FakeDB(users=users)

    customer_calls = []
    monkeypatch.setattr(
        billing_api.stripe.Customer,
        'create',
        lambda **kwargs: customer_calls.append(kwargs),
    )
    monkeypatch.setattr(
        billing_api.stripe.checkout.Session,
        'create',
        lambda **kwargs: SimpleNamespace(url='https://checkout.example/existing'),
    )

    result = await billing_api.create_checkout_session(plan_code='premium', user_id=6, db=db)

    assert result['checkout_url'].endswith('/existing')
    assert customer_calls == []
    assert db.commits == 0


@pytest.mark.asyncio
async def test_create_checkout_session_raises_404_for_unknown_plan():
    db = FakeDB(users=FakeUsersRepo([]))

    with pytest.raises(HTTPException) as exc:
        await billing_api.create_checkout_session(plan_code='gold', user_id=1, db=db)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_stripe_webhook_handles_checkout_completed(monkeypatch):
    user = SimpleNamespace(
        id=11,
        email='hook@example.com',
        provider_customer_id=None,
        provider_subscription_id=None,
        subscription_plan=None,
        subscription_status=None,
        subscription_ends_at=None,
    )
    users = FakeUsersRepo([user])
    db = FakeDB(users=users)

    event = {
        'type': 'checkout.session.completed',
        'data': {
            'object': {
                'metadata': {'user_id': '11', 'plan_code': 'premium'},
                'subscription': 'sub_123',
                'customer': 'cus_123',
            }
        },
    }
    monkeypatch.setattr(billing_api.stripe.Webhook, 'construct_event', lambda **kwargs: event)

    response = await billing_api.stripe_webhook(FakeRequest(), db=db)

    assert response.status_code == 200
    assert users.edit_calls[0][0]['subscription_plan'] == 'premium'
    assert users.edit_calls[0][0]['subscription_status'] == 'active'
    assert db.commits == 1


@pytest.mark.asyncio
async def test_stripe_webhook_marks_subscription_canceled(monkeypatch):
    user = SimpleNamespace(
        id=12,
        email='sub@example.com',
        provider_customer_id='cus_777',
        provider_subscription_id='sub_777',
        subscription_plan='premium',
        subscription_status='active',
        subscription_ends_at=None,
    )
    users = FakeUsersRepo([user])
    db = FakeDB(users=users)

    event = {
        'type': 'customer.subscription.deleted',
        'data': {'object': {'id': 'sub_777'}},
    }
    monkeypatch.setattr(billing_api.stripe.Webhook, 'construct_event', lambda **kwargs: event)

    await billing_api.stripe_webhook(FakeRequest(), db=db)

    assert users.edit_calls[0][0]['subscription_status'] == 'canceled'
    assert db.commits == 1


@pytest.mark.asyncio
async def test_stripe_webhook_marks_payment_failed(monkeypatch):
    user = SimpleNamespace(
        id=13,
        email='pay@example.com',
        provider_customer_id='cus_fail',
        provider_subscription_id='sub_fail',
        subscription_plan='basic',
        subscription_status='active',
        subscription_ends_at=None,
    )
    users = FakeUsersRepo([user])
    db = FakeDB(users=users)

    event = {
        'type': 'invoice.payment_failed',
        'data': {'object': {'customer': 'cus_fail'}},
    }
    monkeypatch.setattr(billing_api.stripe.Webhook, 'construct_event', lambda **kwargs: event)

    await billing_api.stripe_webhook(FakeRequest(), db=db)

    assert users.edit_calls[0][0]['subscription_status'] == 'past_due'
    assert db.commits == 1


@pytest.mark.asyncio
async def test_stripe_webhook_raises_400_on_invalid_signature(monkeypatch):
    db = FakeDB(users=FakeUsersRepo([]))

    def boom(**kwargs):
        raise ValueError('bad sig')

    monkeypatch.setattr(billing_api.stripe.Webhook, 'construct_event', boom)

    with pytest.raises(HTTPException) as exc:
        await billing_api.stripe_webhook(FakeRequest(), db=db)

    assert exc.value.status_code == 400
