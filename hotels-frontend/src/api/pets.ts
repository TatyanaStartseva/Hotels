import { api } from "./client";

export type Pet = {
  id: number;
  user_id?: number;

  name: string;
  species: string;

  temperature_min?: number | null;
  temperature_max?: number | null;
  humidity_min?: number | null;
  humidity_max?: number | null;

  conditions?: string | null;

  vaccinations?: string[] | null;
  chip_id?: string | null;

  diet_type?: string | null;
  diet_details?: string | null;
  feedings_per_day?: number | null;

  license_required?: boolean | null;
  license_number?: string | null;

  cohabitation_allowed?: boolean | null;
  cohabitation_notes?: string | null;
  compatible_species?: string[] | null;
};

export type PetCreate = {
  name: string;
  species: string;

  temperature_min?: number | null;
  temperature_max?: number | null;
  humidity_min?: number | null;
  humidity_max?: number | null;

  conditions?: string | null;

  vaccinations?: string[] | null;
  chip_id?: string | null;

  diet_type?: string | null;
  diet_details?: string | null;
  feedings_per_day?: number | null;

  license_required?: boolean | null;
  license_number?: string | null;

  cohabitation_allowed?: boolean | null;
  cohabitation_notes?: string | null;
  compatible_species?: string[] | null;
};

export type PetUpdate = Partial<PetCreate>;

export async function getMyPets() {
  const res = await api.get<Pet[]>("/pets/me");
  return res.data;
}

export async function createPet(payload: PetCreate) {
  const res = await api.post("/pets", payload);
  return res.data;
}

export async function updatePet(petId: number, payload: PetUpdate) {
  const res = await api.patch(`/pets/${petId}`, payload);
  return res.data;
}

export async function deletePet(petId: number) {
  const res = await api.delete(`/pets/${petId}`);
  return res.data;
}