import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HotelsPage from "./pages/HotelsPage";
import HotelPage from "./pages/HotelPage";
import BookingsPage from "./pages/BookingsPage";
import { initAuthFromStorage } from "./api/auth";   // ← добавили

// при старте приложения подтягиваем токен из localStorage (если был)
initAuthFromStorage();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HotelsPage />} />
        <Route path="/hotels/:id" element={<HotelPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
