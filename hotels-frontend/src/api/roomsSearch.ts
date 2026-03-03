import { api } from "./client";

export type RoomSearchOut = {
  id: number;
  hotel_id: number;
  title: string;
  price: number;
  quantity: number;
  available?: number | null;
  hotel: { id: number; name?: string | null; location?: string | null };
};

export async function searchRooms(params: Record<string, any>): Promise<RoomSearchOut[]> {
  const res = await api.get("/rooms/search", { params });
  return res.data;
}
