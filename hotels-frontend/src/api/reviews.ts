import { api } from "./client";

export type ReviewOut = {
  id: number;
  hotel_id: number;
  user_id: number;
  booking_id: number;
  rating: number;
  text: string;
  created_at: string;
  owner_reply?: string | null;
  owner_reply_at?: string | null;
};

export async function getHotelReviews(hotelId: number) {
  const res = await api.get<ReviewOut[]>("/reviews", { params: { hotel_id: hotelId } });
  return res.data;
}

export async function createReview(payload: { booking_id: number; rating: number; text: string }) {
  const res = await api.post<ReviewOut>("/reviews", payload);
  return res.data;
}

export async function replyReview(reviewId: number, payload: { owner_reply: string }) {
  const res = await api.post<ReviewOut>(`/reviews/${reviewId}/reply`, payload);
  return res.data;
}