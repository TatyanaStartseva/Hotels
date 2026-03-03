import { api } from "./client";

export interface Pet {
  id: number;
  user_id: number;

  temperature_min?: number | null;
  temperature_max?: number | null;
  humidity_min?: number | null;
  humidity_max?: number | null;

  conditions?: string | null;
  vaccinations?: any[] | null;
  chip_id?: string | null;

  diet_type?: string | null;
  diet_details?: string | null;
  feedings_per_day?: number | null;

  license_required: boolean;
  license_number?: string | null;

  cohabitation_allowed: boolean;
  cohabitation_notes?: string | null;
  compatible_species?: any[] | null;
}

export type PetCreatePayload = Partial<Omit<Pet, "id" | "user_id">>;

export async function getMyPets(): Promise<Pet[]> {
  const res = await api.get("/pets/me");
  return res.data;
}

export async function createPet(payload: PetCreatePayload) {
  const res = await api.post("/pets", payload);
  return res.data;
}

export async function deletePet(petId: number) {
  const res = await api.delete(`/pets/${petId}`);
  return res.data;
}
