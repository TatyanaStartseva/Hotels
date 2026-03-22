import { api } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export async function loginUser(data: LoginRequest) {
  const res = await api.post("/auth/login", {
    email: data.email,
    password: data.password,
  });

  if (res.data?.access_token) {
    localStorage.setItem("token", res.data.access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${res.data.access_token}`;
  } else if (typeof res.data === "string") {
    localStorage.setItem("token", res.data);
    api.defaults.headers.common["Authorization"] = `Bearer ${res.data}`;
  }

  return res.data;
}

export async function registerUser(data: LoginRequest) {
  const res = await api.post("/auth/register", {
    email: data.email,
    password: data.password,
  });
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export function initAuthFromStorage() {
  const token = localStorage.getItem("token");

  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}