import { useEffect, useState } from "react";
import { getHotels } from "../api/hotels";      // <- только функция
import type { Hotel } from "../api/hotels";     // <- а это ТИП
import { Link, useNavigate } from "react-router-dom";


export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const text = search.trim() || undefined;
    const data = await getHotels({
      title: text,     // поиск по названию
      location: text,  // И ПО ГОРОДУ ТОЖЕ
    });
    setHotels(data);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Отели</h1>
        <div>
          <button
            onClick={() => navigate("/login")}
            style={{ marginRight: 10 }}
          >
            Войти
          </button>
          <button onClick={() => navigate("/bookings")}>
            Мои бронирования
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Поиск по названию или городу"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={load}>Найти</button>
      </div>

      <ul>
        {hotels.map(h => (
          <li key={h.id} style={{ marginBottom: 10 }}>
            <Link to={`/hotels/${h.id}`}>
              {h.title} – {h.location}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
