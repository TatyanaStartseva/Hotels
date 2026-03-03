from pydantic import BaseModel, ConfigDict


class PetAddRequest(BaseModel):
    temperature_min: float | None = None
    temperature_max: float | None = None
    humidity_min: float | None = None
    humidity_max: float | None = None

    conditions: str | None = None
    vaccinations: list | None = None
    chip_id: str | None = None

    diet_type: str | None = None
    diet_details: str | None = None
    feedings_per_day: int | None = None

    license_required: bool = False
    license_number: str | None = None

    cohabitation_allowed: bool = True
    cohabitation_notes: str | None = None
    compatible_species: list | None = None


class PetAdd(PetAddRequest):
    user_id: int


class PetUpdate(BaseModel):
    temperature_min: float | None = None
    temperature_max: float | None = None
    humidity_min: float | None = None
    humidity_max: float | None = None

    conditions: str | None = None
    vaccinations: list | None = None
    chip_id: str | None = None

    diet_type: str | None = None
    diet_details: str | None = None
    feedings_per_day: int | None = None

    license_required: bool | None = None
    license_number: str | None = None

    cohabitation_allowed: bool | None = None
    cohabitation_notes: str | None = None
    compatible_species: list | None = None


class Pet(PetAdd):
    id: int
    model_config = ConfigDict(from_attributes=True)
