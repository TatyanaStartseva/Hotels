import { useEffect, useState } from "react";
import { getHotels, createHotel, deleteHotel } from "../api/hotels";
import type { Hotel } from "../api/hotels";
import { Link, useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
    checkMe();
  }, []);

  const checkMe = async () => {
  try {
    const me = await getMe();
    setIsLogged(true);

    // БЫСТРЫЙ ВАРИАНТ: считаем админом по email

    // если бек когда-нибудь начнёт отдавать is_admin — тоже учтём
    const isAdminFlag = me.is_admin === true;

    setIsAdmin(isAdminFlag);

    console.log("ME:", me);
    console.log("computed isAdmin:", isAdminByEmail || isAdminFlag);
  } catch (e) {
    console.log("Не залогинен или ошибка /auth/me", e);
    setIsLogged(false);
    setIsAdmin(false);
  }
};


  const loadAll = async () => {
    setMessage(null);
    try {
      const data = await getHotels();
      setHotels(data);
      if (data.length === 0) {
        setMessage("Отели пока не добавлены.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при загрузке отелей.");
    }
  };

  const searchByCity = async () => {
    setMessage(null);
    const text = city.trim();
    if (!text) {
      await loadAll();
      return;
    }
    try {
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

  const handleCreateHotel = async () => {
    if (!newTitle || !newLocation) {
      alert("Заполните название и город");
      return;
    }
    try {
      await createHotel({ title: newTitle, location: newLocation });
      setNewTitle("");
      setNewLocation("");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 403) {
        alert("Нет прав: только администратор может добавлять отели");
      } else {
        alert("Ошибка при создании отеля");
      }
    }
  };

  const handleDeleteHotel = async (id: number) => {
    if (!confirm("Удалить отель?")) return;
    try {
      await deleteHotel(id);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 403) {
        alert("Нет прав: только администратор может удалять отели");
      } else {
        alert("Ошибка при удалении отеля");
      }
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

      {/* DEBUG, чтобы ты видела состояние */}
      <div style={{ marginBottom: 10, fontSize: 12, color: "gray" }}>
        DEBUG: isLogged={String(isLogged)}; isAdmin={String(isAdmin)}
      </div>

      {/* Поиск по городу */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Город (Moscow, MOW...)"
          value={city}
          onChange={e => setCity(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchByCity}>Найти по городу</button>
      </div>

      {/* Поиск по названию */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Название отеля"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchByTitle}>Найти по названию</button>
      </div>

      {message && <p style={{ color: "gray" }}>{message}</p>}

      {/* Добавление отеля — только для админа */}
      {isAdmin && (
        <div
          style={{ border: "1px solid #ccc", padding: 12, marginBottom: 20 }}
        >
          <h3>Добавить отель (только администратор)</h3>
          <div>
            <input
              placeholder="Название"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <input
              placeholder="Город"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <button onClick={handleCreateHotel}>Добавить</button>
          </div>
        </div>
      )}

      {hotels.length > 0 && (
        <ul>
          {hotels.map(h => (
            <li key={h.id} style={{ marginBottom: 10 }}>
              <Link to={`/hotels/${h.id}`}>
                {h.title} – {h.location}
              </Link>
              {isAdmin && (
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => handleDeleteHotel(h.id)}
                >
                  Удалить
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
