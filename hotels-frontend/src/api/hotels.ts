// src/api/hotels.ts
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
