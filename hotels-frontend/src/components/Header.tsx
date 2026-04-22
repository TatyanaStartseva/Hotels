import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe } from "../api/auth";

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHotelOwner, setIsHotelOwner] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMe();
        setIsAdmin(me.is_admin === true);
        setIsHotelOwner(me.is_hotel_owner === true);
      } catch {
        setIsAdmin(false);
        setIsHotelOwner(false);
      }
    };

    load();
  }, []);

  return (
    <div style={{ display: "flex", gap: 16, padding: 16, flexWrap: "wrap" }}>
      <Link to="/">Отели</Link>
      <Link to="/bookings">Брони</Link>
      <Link to="/pets">Питомцы</Link>

      {isHotelOwner && <Link to="/owner/hotels">Мои отели</Link>}

      {isAdmin && <Link to="/admin/ads">Реклама</Link>}
      {isAdmin && <Link to="/admin/users">Пользователи</Link>}
    </div>
  );
}