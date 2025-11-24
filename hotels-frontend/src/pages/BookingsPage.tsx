// src/pages/BookingsPage.tsx
import { useEffect, useState } from "react";
import { getMyBookings } from "../api/bookings";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch((err: any) => {
        if (err?.response?.status === 401) {
          setError("Вы не авторизованы. Войдите в аккаунт.");
        } else {
          setError("Ошибка при загрузке бронирований.");
        }
      });
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Мои бронирования</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {bookings.length === 0 && !error && (
        <p>У вас пока нет бронирований.</p>
      )}

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
