// src/api/rooms.ts
import { api } from "./client";

export interface Room {
  id: number;
  title: string;
  price: number;
  quantity: number;
  available?: number;

  description?: string | null;
  allowed_species?: string[] | null;
  temp_min?: number | null;
  temp_max?: number | null;
  humidity_min?: number | null;
  humidity_max?: number | null;
  room_conditions?: string | null;
}

export async function getRooms(
  hotelId: number,
  params?: { date_from?: string; date_to?: string }
) {
  const res = await api.get<Room[]>(`/rooms/${hotelId}/rooms`, { params });
  return res.data;
}

export async function createRoom(
  hotelId: number,
  payload: { title: string; price: number; quantity: number }
) {
  const res = await api.post(`/rooms/${hotelId}/rooms`, payload);
  return res.data;
}

export async function deleteRoom(hotelId: number, roomId: number) {
  const res = await api.delete(`/rooms/${hotelId}/rooms/${roomId}`);
  return res.data;
}

export async function updateRoom(
  hotelId: number,
  roomId: number,
  payload: { title?: string; price?: number; quantity?: number }
) {
  const res = await api.patch(`/rooms/${hotelId}/rooms/${roomId}`, payload);
  return res.data;
}
