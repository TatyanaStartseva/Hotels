from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB

class RoomsOrm(Base):
    __tablename__ = "rooms"
    id:Mapped[int]=  mapped_column(primary_key=True)
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"))
    title: Mapped[str]
    description: Mapped[str | None]
    price: Mapped[int]
    quantity: Mapped[int]
    allowed_species: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["cat","dog"]
    temp_min: Mapped[float | None]
    temp_max: Mapped[float | None]
    humidity_min: Mapped[float | None]
    humidity_max: Mapped[float | None]

    room_conditions: Mapped[str | None]  # текст “есть террариум, тишина, без солнца”
    vaccinations_required: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["rabies"]
    chip_required: Mapped[bool] = mapped_column(default=False)

    diet_supported: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["dry","natural"]
    feedings_per_day_max: Mapped[int | None]

    license_required: Mapped[bool] = mapped_column(default=False)
    cohabitation_allowed: Mapped[bool] = mapped_column(default=True)