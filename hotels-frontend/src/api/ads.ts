import { api } from "./client";

export type AdCreate = {
  title: string;
  description?: string | null;
  image_url?: string | null;
  target_url?: string | null;
  is_active?: boolean;
  plan_name?: string;
};

export type AdPatch = Partial<AdCreate>;

export type AdOut = {
  id: number;
  owner_id?: number | null;
  title: string;
  description?: string | null;
  image_url?: string | null;
  target_url?: string | null;
  is_active: boolean;
  plan_name: string;
  weight: number;
  created_at: string;
};

export async function getRandomAd() {
  const res = await api.get<AdOut | null>("/ads/random");
  return res.data;
}

export async function registerAdClick(adId: number) {
  const res = await api.post(`/ads/${adId}/click`);
  return res.data;
}

export async function getAdsAdmin() {
  const res = await api.get<AdOut[]>("/ads");
  return res.data;
}

export async function createAd(payload: AdCreate) {
  const res = await api.post<AdOut>("/ads", payload);
  return res.data;
}

export async function updateAd(adId: number, payload: AdPatch) {
  const res = await api.patch<AdOut>(`/ads/${adId}`, payload);
  return res.data;
}

export async function deleteAd(adId: number) {
  const res = await api.delete(`/ads/${adId}`);
  return res.data;
}