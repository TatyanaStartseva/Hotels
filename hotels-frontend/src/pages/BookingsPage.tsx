// src/pages/BookingsPage.tsx
import { useEffect, useState } from "react";
import { getMyBookings } from "../api/bookings";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    getMyBookings().then(setBookings).catch(() => {
      alert("Нужно залогиниться");
    });
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Мои бронирования</h1>
      <ul>
        {bookings.map(b => (
          <li key={b.id}>
            Комната {b.room_id}, с {b.date_from} по {b.date_to}, цена {b.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
