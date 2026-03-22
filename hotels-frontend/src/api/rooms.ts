import { api } from "./client";

export type Room = {
  id: number;
  hotel_id: number;

  title: string;
  description?: string | null;

  price: number;
  quantity: number;
  available?: number;

  allowed_species?: string[] | null;
  temp_min?: number | null;
  temp_max?: number | null;
  humidity_min?: number | null;
  humidity_max?: number | null;

  room_conditions?: string | null;
  vaccinations_required?: string[] | null;
  chip_required?: boolean;

  diet_supported?: string[] | null;
  feedings_per_day_max?: number | null;

  license_required?: boolean;
  cohabitation_allowed?: boolean;
};

export type RoomCreate = {
  title: string;
  description?: string | null;

  price: number;
  quantity: number;

  allowed_species?: string[] | null;
  temp_min?: number | null;
  temp_max?: number | null;
  humidity_min?: number | null;
  humidity_max?: number | null;

  room_conditions?: string | null;
  vaccinations_required?: string[] | null;
  chip_required?: boolean;

  diet_supported?: string[] | null;
  feedings_per_day_max?: number | null;

  license_required?: boolean;
  cohabitation_allowed?: boolean;
};

export type RoomPatch = Partial<RoomCreate>;

export async function getRooms(
  hotelId: number,
  params?: { date_from?: string; date_to?: string }
) {
  const res = await api.get<Room[]>(`/rooms/${hotelId}/rooms`, { params });
  return res.data;
}

export async function getRoomsByHotel(
  hotelId: number,
  params?: { date_from?: string; date_to?: string }
) {
  const res = await api.get<Room[]>(`/rooms/${hotelId}/rooms`, { params });
  return res.data;
}

export async function createRoom(hotelId: number, payload: RoomCreate) {
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
  payload: RoomPatch
) {
  const res = await api.patch(`/rooms/${hotelId}/rooms/${roomId}`, payload);
  return res.data;
}