import { api } from "./client";

export type AdminUser = {
  id: number;
  email: string;
  is_admin: boolean;
  is_hotel_owner: boolean;
};

export async function getAllUsers(): Promise<AdminUser[]> {
  const res = await api.get("/admin/users");
  return res.data;
}

export async function grantHotelOwner(userId: number) {
  const res = await api.patch(`/admin/users/${userId}/grant-hotel-owner`);
  return res.data;
}

export async function revokeHotelOwner(userId: number) {
  const res = await api.patch(`/admin/users/${userId}/revoke-hotel-owner`);
  return res.data;
}