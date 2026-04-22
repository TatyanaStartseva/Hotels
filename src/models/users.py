from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
from sqlalchemy import String, Boolean, DateTime
from datetime import datetime


class UsersOrm(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(200))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hotel_owner: Mapped[bool] = mapped_column(Boolean, default=False)

    subscription_plan: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(30), default="free")
    payment_provider: Mapped[str | None] = mapped_column(String(30), nullable=True)

    provider_customer_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(200), nullable=True)

    subscription_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    subscription_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)