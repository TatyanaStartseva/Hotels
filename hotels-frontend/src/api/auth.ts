// src/api/auth.ts
import { api } from "./client";

export interface AuthPayload {
  email: string;
  password: string;
}

// сохраняем токен и навешиваем его на все запросы axios
function saveToken(token: string) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  localStorage.setItem("access_token", token);
}

// инициализируем авторизацию при загрузке приложения (если токен уже был)
export function initAuthFromStorage() {
  const token = localStorage.getItem("access_token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export async function login(data: AuthPayload) {
  const res = await api.post("/auth/login", data);
  const token = res.data?.access_token;
  if (token) {
    saveToken(token);
  }
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
