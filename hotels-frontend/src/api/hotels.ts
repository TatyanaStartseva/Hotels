import { api } from "./client";

export interface Hotel {
  id: number;
  title: string;
  location: string;
  location_ru?: string;
  title_ru?: string;
  images?: string[];
  owner_id?: number | null;
  status?: "draft" | "published" | "archived";
}

export async function getHotels(params?: {
  page?: number;
  per_page?: number;
  title?: string;
  location?: string;
  images?: string[];
}) {
  const res = await api.get<Hotel[]>("/hotels", { params });
  return res.data;
}

export async function createHotel(payload: {
  title: string;
  location: string;
  images?: string[];
}) {
  const res = await api.post("/hotels", payload);
  return res.data;
}

export async function deleteHotel(id: number) {
  const res = await api.delete(`/hotels/${id}`);
  return res.data;
}

export async function updateHotel(
  id: number,
  payload: { title?: string; location?: string; images?: string[] }
) {
  const res = await api.patch(`/hotels/${id}`, payload);
  return res.data;
}

export async function createOwnerHotel(payload: {
  title: string;
  location: string;
  images?: string[];
}) {
  const res = await api.post("/hotels/owner", payload);
  return res.data;
}

export async function getMyHotels() {
  const res = await api.get<Hotel[]>("/hotels/owner/my");
  return res.data;
}

export async function patchMyHotel(
  id: number,
  payload: { title?: string; location?: string; images?: string[] }
) {
  const res = await api.patch(`/hotels/owner/${id}`, payload);
  return res.data;
}

export async function publishMyHotel(id: number) {
  const res = await api.post(`/hotels/owner/${id}/publish`);
  return res.data;
}

export async function unpublishMyHotel(id: number) {
  const res = await api.post(`/hotels/owner/${id}/unpublish`);
  return res.data;
}