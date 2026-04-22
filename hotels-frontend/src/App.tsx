// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HotelsPage from "./pages/HotelsPage";
import HotelPage from "./pages/HotelPage";
import BookingsPage from "./pages/BookingsPage";
import PetsPage from "./pages/PetsPage";
import AdminAdsPage from "./pages/AdminAdsPage";
import AdminRoute from "./components/AdminRoute";
import PlansPage from "./pages/PlansPage";
import OwnerHotelsPage from "./pages/OwnerHotelsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function App() {
  return (
  <BrowserRouter>
  <Routes>
    <Route
      path="/admin/ads"
      element={
        <AdminRoute>
          <AdminAdsPage />
        </AdminRoute>
      }
    />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<HotelsPage />} />
    <Route path="/hotels/:id" element={<HotelPage />} />
    <Route path="/bookings" element={<BookingsPage />} />
    <Route
  path="/admin/users"
  element={
    <AdminRoute>
      <AdminUsersPage />
    </AdminRoute>
  }
/><Route path="/pets" element={<PetsPage />} />
    <Route path="/owner/hotels" element={<OwnerHotelsPage />} />
    <Route path="/plans" element={<PlansPage />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
</BrowserRouter>
  );
}

export default App;
