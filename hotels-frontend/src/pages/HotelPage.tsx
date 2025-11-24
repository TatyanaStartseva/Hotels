import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRooms } from "../api/rooms";
import type { Room } from "../api/rooms";
import { createBooking } from "../api/bookings";

export default function HotelPage() {
  const { id } = useParams<{ id: string }>();
  const hotelId = Number(id);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!hotelId) return;
    getRooms(hotelId).then(setRooms);
  }, [hotelId]);

  const handleBook = async (roomId: number) => {
    if (!dateFrom || !dateTo) {
      alert("Выбери даты");
      return;
    }
    await createBooking({
      room_id: roomId,
      date_from: dateFrom,
      date_to: dateTo,
    });
    alert("Бронь создана");
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>Отель #{hotelId}</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          Дата заезда:
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 10 }}>
          Дата выезда:
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </label>
      </div>

      <h2>Комнаты</h2>
      <ul>
        {rooms.map(r => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            {r.title} – {r.price}₽ – осталось {r.quantity}
            <button onClick={() => handleBook(r.id)} style={{ marginLeft: 10 }}>
              Забронировать
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
