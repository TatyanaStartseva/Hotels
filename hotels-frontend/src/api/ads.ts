import { api } from "./client";

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