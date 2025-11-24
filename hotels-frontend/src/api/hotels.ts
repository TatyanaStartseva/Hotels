import { api } from "./client";

export interface Hotel {
  id: number;
  title: string;
  location: string;
}

export async function getHotels(params?: {
  page?: number;
  per_page?: number;
  title?: string;
  location?: string;
}) {
  const res = await api.get<Hotel[]>("/hotels", { params });
  return res.data;
}

export async function createHotel(data: { title: string; location: string }) {
  const res = await api.post("/hotels", data);
  return res.data;
}

export async function updateHotel(id: number, data: { title?: string; location?: string }) {
  const res = await api.patch(`/hotels/${id}`, data);
  return res.data;
}

export async function deleteHotel(id: number) {
  const res = await api.delete(`/hotels/${id}`);
  return res.data;
}
