import axios from "axios";
import { api } from "./client";

export type Booking = {
  id: number;
  room_id: number;
  user_id?: number;
  pet_id?: number;
  hotel_title?: string;
  pet_name?: string;
  date_from?: string;
  date_to?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
};

export type BookingCreate = {
  room_id: number;
  pet_id: number;
  date_from?: string;
  date_to?: string;
  start_date?: string;
  end_date?: string;
  pet_id?: number | null;
};

export async function getMyBookings() {
  const res = await api.get<Booking[]>("/bookings/me");
  return res.data;
}

export async function createBooking(payload: BookingCreate) {
  const res = await api.post("/bookings", payload);
  return res.data;
}

export async function deleteBooking(bookingId: number) {
  try {
    const res = await api.delete(`/bookings/${bookingId}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.detail || "Не удалось удалить бронирование";
      throw new Error(message);
    }
    throw new Error("Неизвестная ошибка при удалении бронирования");
  }
}