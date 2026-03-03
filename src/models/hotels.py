from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column
from sqlalchemy import text


class HotelsOrm(Base):
    __tablename__ = "hotels"
    id:Mapped[int]=  mapped_column(primary_key=True)
    title:Mapped[str] =mapped_column(String(100))
    location: Mapped[str]=mapped_column(String(100))
    images: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,  # python default
        server_default=text("'[]'::jsonb"),  # db default
    )
