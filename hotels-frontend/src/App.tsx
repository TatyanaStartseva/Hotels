// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HotelsPage from "./pages/HotelsPage";
import HotelPage from "./pages/HotelPage";
import BookingsPage from "./pages/BookingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HotelsPage />} />
        <Route path="/hotels/:id" element={<HotelPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
