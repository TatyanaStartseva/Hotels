import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url: string = err?.config?.url ?? "";

    // если бэк перезапустился или сети нет — НЕ редиректим, просто отдаём ошибку
    if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
      return Promise.reject(err);
    }

    // редиректим только если реально 401 и это не /auth/login
    if (status === 401 && !url.includes("/auth/login")) {
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(err);
  }
);
