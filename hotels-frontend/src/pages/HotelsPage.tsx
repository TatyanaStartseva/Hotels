// src/pages/HotelsPage.tsx
import { useEffect, useState } from "react";
import {
  getHotels,
  createHotel,
  deleteHotel,
  updateHotel,
} from "../api/hotels";
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

  // состояние для редактирования
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
    checkMe();
  }, []);

  const checkMe = async () => {
    try {
      const me = await getMe();
      setIsLogged(true);
      // теперь is_admin приходит с бэка
      setIsAdmin(me.is_admin === true);
      console.log("ME:", me);
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

  const startEdit = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setEditTitle(hotel.title);
    setEditLocation(hotel.location);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditLocation("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateHotel(editingId, {
        title: editTitle,
        location: editLocation,
      });
      await loadAll();
      cancelEdit();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 403) {
        alert("Нет прав: только администратор может изменять отели");
      } else {
        alert("Ошибка при изменении отеля");
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

      <div style={{ marginBottom: 10, fontSize: 12, color: "gray" }}>
        DEBUG: isLogged={String(isLogged)}; isAdmin={String(isAdmin)}
      </div>

      {/* Поиск по городу */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Город (Moscow, MOW...)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchByCity}>Найти по городу</button>
      </div>

      {/* Поиск по названию */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Название отеля"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={searchByTitle}>Найти по названию</button>
      </div>

      {message && <p style={{ color: "gray" }}>{message}</p>}

      {/* Добавление отеля — только админ */}
      {isAdmin && (
        <div
          style={{ border: "1px solid #ccc", padding: 12, marginBottom: 20 }}
        >
          <h3>Добавить отель (только администратор)</h3>
          <div>
            <input
              placeholder="Название"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <input
              placeholder="Город"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <button onClick={handleCreateHotel}>Добавить</button>
          </div>
        </div>
      )}

      {hotels.length > 0 && (
        <ul>
          {hotels.map((h) => (
            <li key={h.id} style={{ marginBottom: 10 }}>
              {editingId === h.id ? (
                // Режим редактирования
                <div>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  <input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  <button onClick={saveEdit} style={{ marginRight: 4 }}>
                    Сохранить
                  </button>
                  <button onClick={cancelEdit}>Отмена</button>
                </div>
              ) : (
                // Обычный режим
                <div>
                  <Link to={`/hotels/${h.id}`}>
                    {h.title} – {h.location}
                  </Link>
                  {isAdmin && (
                    <>
                      <button
                        style={{ marginLeft: 10 }}
                        onClick={() => startEdit(h)}
                      >
                        Изменить
                      </button>
                      <button
                        style={{ marginLeft: 10 }}
                        onClick={() => handleDeleteHotel(h.id)}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
