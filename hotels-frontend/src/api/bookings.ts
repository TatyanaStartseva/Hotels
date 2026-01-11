// src/api/bookings.ts
import axios from "axios";
import { api } from "./client";

export interface BookingPayload {
  room_id: number;
  date_from: string; // "2025-01-01"
  date_to: string;
}

export async function createBooking(payload: {
  room_id: number;
  date_from: string;
  date_to: string;
}) {
  try {
    const res = await api.post("/bookings", payload);
    return res.data;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;

      // иногда detail может быть массивом (если pydantic validation)
      if (Array.isArray(detail)) {
        throw new Error(detail.map((x) => x.msg).join(", "));
      }

      throw new Error(detail ?? "Ошибка при бронировании");
    }

    throw new Error("Ошибка при бронировании");
  }
}

export async function getMyBookings() {
  const res = await api.get("/bookings/me");
  return res.data;
}
