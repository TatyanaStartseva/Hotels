import { createContext, useEffect, useState } from "react";
import { getMe } from "./api/auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HotelsPage from "./pages/HotelsPage";
import HotelPage from "./pages/HotelPage";
import BookingsPage from "./pages/BookingsPage";
import LoginPage from "./pages/LoginPage";

export const AuthContext = createContext({
  isAdmin: false,
  isLogged: false,
});

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    getMe()
      .then(me => {
        setIsLogged(true);
        setIsAdmin(me.is_admin === true);
      })
      .catch(() => {
        setIsLogged(false);
        setIsAdmin(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, isLogged }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HotelsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/hotels/:id" element={<HotelPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
