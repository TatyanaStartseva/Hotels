# src/models/pets.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from src.database import Base


class PetsOrm(Base):
    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    species: Mapped[str] = mapped_column(default="unknown")  # cat/dog/snake/bird/rodent/spider/reptile...
    name : Mapped[str]= mapped_column(String(100))

    temperature_min: Mapped[float | None]
    temperature_max: Mapped[float | None]
    humidity_min: Mapped[float | None]
    humidity_max: Mapped[float | None]

    conditions: Mapped[str | None]

    vaccinations: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    chip_id: Mapped[str | None]

    diet_type: Mapped[str | None]
    diet_details: Mapped[str | None]
    feedings_per_day: Mapped[int | None]

    license_required: Mapped[bool] = mapped_column(default=False)
    license_number: Mapped[str | None]

    cohabitation_allowed: Mapped[bool] = mapped_column(default=True)
    cohabitation_notes: Mapped[str | None]
    compatible_species: Mapped[list | None] = mapped_column(JSONB, nullable=True)
