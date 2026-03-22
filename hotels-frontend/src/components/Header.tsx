import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        setIsAdmin(res.data.is_admin);
      } catch {
        setIsAdmin(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ display: "flex", gap: 16, padding: 16 }}>
      <Link to="/">Отели</Link>
      <Link to="/bookings">Брони</Link>
      <Link to="/pets">Питомцы</Link>

      {/* 👇 ВОТ СЮДА */}
      {isAdmin && <Link to="/admin/ads">Реклама</Link>}
    </div>
  );
}