import { api } from "./client";

export interface Room {
  id: number;
  hotel_id: number;
  title: string;
  description?: string | null;
  price: number;
  quantity: number;
}

export async function getRooms(hotelId: number) {
  const res = await api.get<Room[]>(`/rooms/${hotelId}/rooms`);
  return res.data;
}

export async function createRoom(hotelId: number, data: {
  title: string;
  description?: string;
  price: number;
  quantity: number;
}) {
  const res = await api.post(`/rooms/${hotelId}/rooms`, data);
  return res.data;
}

export async function updateRoom(hotelId: number, roomId: number, data: Partial<{
  title: string;
  description: string;
  price: number;
  quantity: number;
}>) {
  const res = await api.patch(`/rooms/${hotelId}/rooms/${roomId}`, data);
  return res.data;
}

export async function deleteRoom(hotelId: number, roomId: number) {
  const res = await api.delete(`/rooms/${hotelId}/rooms/${roomId}`);
  return res.data;
}
