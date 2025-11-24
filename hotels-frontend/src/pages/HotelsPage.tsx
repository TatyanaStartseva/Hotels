import { useEffect, useState } from "react";
import { getHotels } from "../api/hotels";
import type { Hotel } from "../api/hotels";
import { Link, useNavigate } from "react-router-dom";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [city, setCity] = useState("");   // для поиска по городу
  const [title, setTitle] = useState(""); // для поиска по названию
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  // загрузить все отели без фильтра
  const loadAll = async () => {
    setMessage(null);
    try {
      const data = await getHotels();
      setHotels(data);
      if (data.length === 0) {
        setMessage("Отели не найдены. Добавьте их через /docs → POST /hotels.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при загрузке отелей.");
    }
  };

  // поиск по ГОРОДУ
  const searchByCity = async () => {
    setMessage(null);
    const text = city.trim();
    if (!text) {
      await loadAll();
      return;
    }
    try {
      // сюда передаем город как есть (Moscow, Париж, MOW и т.п.)
      const data = await getHotels({ location: text });
      setHotels(data);
      if (data.length === 0) {
        setMessage("Отели в этом городе не найдены.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при поиске по городу.");
    }
  };

  // поиск по НАЗВАНИЮ отеля
  const searchByTitle = async () => {
    setMessage(null);
    const text = title.trim();
    if (!text) {
      await loadAll();
      return;
    }
    try {
      const data = await getHotels({ title: text });
      setHotels(data);
      if (data.length === 0) {
        setMessage("Отели с таким названием не найдены.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при поиске по названию.");
    }
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

      {/* Поиск по городу */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Город (Moscow, Paris или код MOW)"
          value={city}
          onChange={e => setCity(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchByCity}>Найти по городу</button>
      </div>

      {/* Поиск по названию */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Название отеля (полностью или часть)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchByTitle}>Найти по названию</button>
      </div>

      {message && (
        <p style={{ color: "gray", marginBottom: 10 }}>{message}</p>
      )}

      {hotels.length > 0 && (
        <ul>
          {hotels.map(h => (
            <li key={h.id} style={{ marginBottom: 10 }}>
              <Link to={`/hotels/${h.id}`}>
                {h.title} – {h.location}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
