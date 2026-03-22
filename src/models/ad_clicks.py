from datetime import datetime
from sqlalchemy import ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class AdClickOrm(Base):
    __tablename__ = "ad_clicks"

    id: Mapped[int] = mapped_column(primary_key=True)
    ad_id: Mapped[int] = mapped_column(ForeignKey("ads.id"), index=True)
    clicked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)