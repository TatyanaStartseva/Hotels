// src/api/rooms.ts
import { api } from "./client";

export interface Room {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

export async function getRooms(hotelId: number) {
  const res = await api.get<Room[]>(`/rooms/${hotelId}/rooms`);
  return res.data;
}
