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
};

export async function getMyBookings() {
  const res = await api.get<Booking[]>("/bookings/me");
  return res.data;
}

export async function createBooking(payload: BookingCreate) {
  const res = await api.post("/bookings", payload);
  return res.data;
}

export async function cancelBooking(bookingId: number) {
  try {
    const res = await api.patch(`/bookings/${bookingId}/cancel`);
    return res.data;
  } catch {
    const res = await api.delete(`/bookings/${bookingId}`);
    return res.data;
  }
}