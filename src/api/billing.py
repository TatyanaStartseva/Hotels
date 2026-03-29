from datetime import datetime
import stripe

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from src.api.dependencies import DBDep, UserIdDep
from src.config import settings

router = APIRouter(prefix="/billing", tags=["Оплата и подписки"])

stripe.api_key = settings.STRIPE_SECRET_KEY

PLANS = {
    "basic": {
        "name": "Базовый",
        "price_id": settings.STRIPE_PRICE_BASIC,
        "description": "Базовый тариф",
    },
    "pro": {
        "name": "Pro",
        "price_id": settings.STRIPE_PRICE_PRO,
        "description": "Расширенный тариф",
    },
    "premium": {
        "name": "Premium",
        "price_id": settings.STRIPE_PRICE_PREMIUM,
        "description": "Максимальный тариф",
    },
}


@router.get("/plans")
async def get_plans():
    return [
        {"code": k, **v}
        for k, v in PLANS.items()
    ]


@router.get("/me")
async def get_my_subscription(user_id: UserIdDep, db: DBDep):
    user = await db.users.get_one_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return {
        "plan": user.subscription_plan,
        "status": user.subscription_status,
        "ends_at": user.subscription_ends_at,
    }


@router.post("/checkout/{plan_code}")
async def create_checkout_session(plan_code: str, user_id: UserIdDep, db: DBDep):
    if plan_code not in PLANS:
        raise HTTPException(status_code=404, detail="Тариф не найден")

    user = await db.users.get_one_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    customer_id = user.provider_customer_id

    if not customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)}
        )
        customer_id = customer.id
        await db.users.edit(
            {"provider_customer_id": customer_id, "payment_provider": "stripe"},
            id=user.id
        )
        await db.commit()

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[
            {
                "price": PLANS[plan_code]["price_id"],
                "quantity": 1,
            }
        ],
        success_url=f"{settings.FRONTEND_URL}/plans?payment=success",
        cancel_url=f"{settings.FRONTEND_URL}/plans?payment=cancel",
        metadata={
            "user_id": str(user.id),
            "plan_code": plan_code,
        },
    )

    return {"checkout_url": session.url}
@router.post("/webhook")
async def stripe_webhook(request: Request, db: DBDep):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        metadata = data_object.get("metadata", {})
        user_id = int(metadata["user_id"])
        plan_code = metadata["plan_code"]

        subscription_id = data_object.get("subscription")
        customer_id = data_object.get("customer")

        await db.users.edit(
            {
                "subscription_plan": plan_code,
                "subscription_status": "active",
                "provider_subscription_id": subscription_id,
                "provider_customer_id": customer_id,
                "payment_provider": "stripe",
                "subscription_started_at": datetime.utcnow(),
            },
            id=user_id,
        )
        await db.commit()

    elif event_type == "customer.subscription.deleted":
        subscription_id = data_object.get("id")

        user = await db.users.get_one_or_none(provider_subscription_id=subscription_id)
        if user:
            await db.users.edit(
                {
                    "subscription_status": "canceled",
                },
                id=user.id,
            )
            await db.commit()

    elif event_type == "invoice.payment_failed":
        customer_id = data_object.get("customer")

        user = await db.users.get_one_or_none(provider_customer_id=customer_id)
        if user:
            await db.users.edit(
                {
                    "subscription_status": "past_due",
                },
                id=user.id,
            )
            await db.commit()

    return JSONResponse({"ok": True})