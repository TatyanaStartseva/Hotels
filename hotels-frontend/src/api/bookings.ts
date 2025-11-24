// src/api/bookings.ts
import { api } from "./client";

export interface BookingPayload {
  room_id: number;
  date_from: string; // "2025-01-01"
  date_to: string;
}

export async function createBooking(payload: BookingPayload) {
  const res = await api.post("/bookings", payload);
  return res.data;
}

export async function getMyBookings() {
  const res = await api.get("/bookings/me");
  return res.data;
}
