// src/pages/HotelPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRooms,  createRoom, deleteRoom, updateRoom } from "../api/rooms";
import { createBooking } from "../api/bookings";
import { getMe } from "../api/auth";
import type { Room } from "../api/rooms";


export default function HotelPage() {
  const { id } = useParams<{ id: string }>();
  const hotelId = Number(id);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  // состояние для добавления комнаты
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number | "">("");

  // состояние для редактирования комнаты
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editQuantity, setEditQuantity] = useState<number | "">("");
  useEffect(() => {
  if (!hotelId) return;
  loadRooms();
  checkMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [hotelId]);

useEffect(() => {
  if (!hotelId) return;
  loadRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dateFrom, dateTo]);

const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);


  const checkMe = async () => {
    try {
      const me = await getMe();
      setIsAdmin(me.is_admin === true);
      console.log("ME (HotelPage):", me);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadRooms = async () => {
  try {
    const params =
      dateFrom && dateTo ? { date_from: dateFrom, date_to: dateTo } : undefined;

    const data = await getRooms(hotelId, params);
    setRooms(data);
  } catch (e) {
    console.error("loadRooms failed:", e);
  }
};



  const handleBook = async (roomId: number) => {
  if (!dateFrom || !dateTo) {
    alert("Выбери даты");
    return;
  }
  if (bookingRoomId !== null) return;

  try {
    setBookingRoomId(roomId);

    await createBooking({
      room_id: roomId,
      date_from: dateFrom,
      date_to: dateTo,
    });

    // после успешного бронирования просто перезагружаем комнаты
    await loadRooms();

    alert("Бронь создана");
  } catch (e) {
    console.error("createBooking failed:", e);
    alert("Ошибка при бронировании");
  } finally {
    setBookingRoomId(null);
  }
};

  const handleCreateRoom = async () => {
    if (!newTitle || newPrice === "" || newQuantity === "") {
      alert("Заполни все поля для комнаты");
      return;
    }
    try {
      await createRoom(hotelId, {
        title: newTitle,
        price: Number(newPrice),
        quantity: Number(newQuantity),
      });
      setNewTitle("");
      setNewPrice("");
      setNewQuantity("");
      await loadRooms();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 403) {
        alert("Нет прав: только администратор может добавлять комнаты");
      } else {
        alert("Ошибка при добавлении комнаты");
      }
    }
  };

  const startEditRoom = (room: Room) => {
    setEditingId(room.id);
    setEditTitle(room.title);
    setEditPrice(room.price);
    setEditQuantity(room.quantity);
  };

  const cancelEditRoom = () => {
    setEditingId(null);
    setEditTitle("");
    setEditPrice("");
    setEditQuantity("");
  };

  const saveEditRoom = async () => {
    if (!editingId) return;
    try {
      await updateRoom(hotelId, editingId, {
        title: editTitle,
        price: editPrice === "" ? undefined : Number(editPrice),
        quantity: editQuantity === "" ? undefined : Number(editQuantity),
      });
      await loadRooms();
      cancelEditRoom();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 403) {
        alert("Нет прав: только администратор может изменять комнаты");
      } else {
        alert("Ошибка при изменении комнаты");
      }
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Удалить комнату?")) return;
    try {
      await deleteRoom(hotelId, roomId);
      await loadRooms();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 403) {
        alert("Нет прав: только администратор может удалять комнаты");
      } else {
        alert("Ошибка при удалении комнаты");
      }
    }
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
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 10 }}>
          Дата выезда:
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>

      <h2>Комнаты</h2>

      <ul style={{ marginBottom: 20 }}>
        {rooms.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            {editingId === r.id ? (
              // режим редактирования комнаты
              <div>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ marginRight: 8, width: 80 }}
                />
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) =>
                    setEditQuantity(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  style={{ marginRight: 8, width: 80 }}
                />
                <button onClick={saveEditRoom} style={{ marginRight: 4 }}>
                  Сохранить
                </button>
                <button onClick={cancelEditRoom}>Отмена</button>
              </div>
            ) : (
              // обычный режим
              <div>
                {r.title} – {r.price}₽ – осталось {r.available ?? r.quantity}
                <button
                  onClick={() => handleBook(r.id)}
                  disabled={bookingRoomId === r.id}
                  style={{ marginLeft: 10 }}
                >
                  {bookingRoomId === r.id ? "Бронирую..." : "Забронировать"}
                </button>
                {isAdmin && (
                  <>
                    <button
                      style={{ marginLeft: 10 }}
                      onClick={() => startEditRoom(r)}
                    >
                      Изменить
                    </button>
                    <button
                      style={{ marginLeft: 10 }}
                      onClick={() => handleDeleteRoom(r.id)}
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

      {/* Блок добавления комнаты — только админ */}
      {isAdmin && (
        <div style={{ border: "1px solid #ccc", padding: 12 }}>
          <h3>Добавить комнату</h3>
          <div>
            <input
              placeholder="Название"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <input
              placeholder="Цена"
              type="number"
              value={newPrice}
              onChange={(e) =>
                setNewPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              style={{ marginRight: 8, width: 80 }}
            />
            <input
              placeholder="Количество"
              type="number"
              value={newQuantity}
              onChange={(e) =>
                setNewQuantity(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              style={{ marginRight: 8, width: 80 }}
            />
            <button onClick={handleCreateRoom}>Добавить комнату</button>
          </div>
        </div>
      )}
    </div>
  );
}
