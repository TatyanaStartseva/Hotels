// src/api/auth.ts
import { api } from "./client";

export interface AuthPayload {
  email: string;
  password: string;
}

export async function login(data: AuthPayload) {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function register(data: AuthPayload) {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}
