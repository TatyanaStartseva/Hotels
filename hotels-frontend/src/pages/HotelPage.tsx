// hotels-frontend/src/pages/HotelPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getRooms, createRoom, deleteRoom, updateRoom } from "../api/rooms";
import type { Room } from "../api/rooms";

import { createBooking, getMyBookings } from "../api/bookings";
import type { Booking } from "../api/bookings";

import { getMe } from "../api/auth";

import { getHotelReviews, createReview, replyReview } from "../api/reviews";
import type { ReviewOut } from "../api/reviews";

export default function HotelPage() {
  const { id } = useParams<{ id: string }>();
  const hotelId = Number(id);

  const today = new Date().toISOString().slice(0, 10);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);

  // ---------- Admin: create room ----------
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newQuantity, setNewQuantity] = useState<number | "">("");
  const [newDescription, setNewDescription] = useState("");

  const [newAllowedSpecies, setNewAllowedSpecies] = useState("");
  const [newTempMin, setNewTempMin] = useState<number | "">("");
  const [newTempMax, setNewTempMax] = useState<number | "">("");
  const [newHumMin, setNewHumMin] = useState<number | "">("");
  const [newHumMax, setNewHumMax] = useState<number | "">("");

  const [newRoomConditions, setNewRoomConditions] = useState("");
  const [newVaccinations, setNewVaccinations] = useState("");
  const [newChipRequired, setNewChipRequired] = useState(false);

  const [newDietSupported, setNewDietSupported] = useState("");
  const [newFeedingsMax, setNewFeedingsMax] = useState<number | "">("");

  const [newLicenseRequired, setNewLicenseRequired] = useState(false);
  const [newCohabAllowed, setNewCohabAllowed] = useState(true);

  // ---------- Admin: edit room ----------
  const [editingId, setEditingId] = useState<number | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editQuantity, setEditQuantity] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");

  const [editAllowedSpecies, setEditAllowedSpecies] = useState("");
  const [editTempMin, setEditTempMin] = useState<number | "">("");
  const [editTempMax, setEditTempMax] = useState<number | "">("");
  const [editHumMin, setEditHumMin] = useState<number | "">("");
  const [editHumMax, setEditHumMax] = useState<number | "">("");

  const [editRoomConditions, setEditRoomConditions] = useState("");
  const [editVaccinations, setEditVaccinations] = useState("");
  const [editChipRequired, setEditChipRequired] = useState(false);

  const [editDietSupported, setEditDietSupported] = useState("");
  const [editFeedingsMax, setEditFeedingsMax] = useState<number | "">("");

  const [editLicenseRequired, setEditLicenseRequired] = useState(false);
  const [editCohabAllowed, setEditCohabAllowed] = useState(true);

  // ---------- Reviews ----------
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  const [reviewBookingId, setReviewBookingId] = useState<number | "">("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");

  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>("");

  // ---------- helpers ----------
  const roomIdSet = useMemo(() => new Set(rooms.map((r) => r.id)), [rooms]);

  const myBookingsForThisHotel = useMemo(() => {
    return myBookings.filter((b) => roomIdSet.has(b.room_id));
  }, [myBookings, roomIdSet]);

  // ---------- loaders ----------
  const checkMe = async () => {
    try {
      const me = await getMe();
      setIsAdmin(me.is_admin === true);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadRooms = async () => {
    try {
      const params = dateFrom && dateTo ? { date_from: dateFrom, date_to: dateTo } : undefined;
      const data = await getRooms(hotelId, params);
      setRooms(data);
    } catch (e) {
      console.error("loadRooms failed:", e);
      setRooms([]);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await getHotelReviews(hotelId);
      setReviews(data);
    } catch (e) {
      console.error("loadReviews failed:", e);
      setReviews([]);
    }
  };

  const loadMyBookings = async () => {
    try {
      const data = await getMyBookings();
      setMyBookings(data);
    } catch (e) {
      console.error("loadMyBookings failed:", e);
      setMyBookings([]);
    }
  };

  // init on hotel change
  useEffect(() => {
    if (!hotelId) return;
    loadRooms();
    loadReviews();
    loadMyBookings();
    checkMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  // reload availability on date change
  useEffect(() => {
    if (!hotelId) return;
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // ---------- actions ----------
  const handleBook = async (roomId: number) => {
    if (!dateFrom || !dateTo) {
      alert("Выбери даты");
      return;
    }
    if (dateFrom >= dateTo) {
      alert("Дата заезда должна быть раньше даты выезда");
      return;
    }
    if (dateFrom < today) {
      alert("Нельзя бронировать даты в прошлом");
      return;
    }
    if (bookingRoomId !== null) return;

    try {
      setBookingRoomId(roomId);
      await createBooking({ room_id: roomId, date_from: dateFrom, date_to: dateTo });
      await loadRooms();
      await loadMyBookings(); // чтобы сразу появилась бронь в отзывах
      alert("Бронь создана");
    } catch (e: any) {
      console.error("createBooking failed:", e);
      alert(e?.response?.data?.detail ?? e?.message ?? "Ошибка при бронировании");
    } finally {
      setBookingRoomId(null);
    }
  };

  const handleCreateRoom = async () => {
    if (!newTitle || newPrice === "" || newQuantity === "") {
      alert("Заполни обязательные поля: название, цена, количество");
      return;
    }

    const allowed_species = newAllowedSpecies.split(",").map((s) => s.trim()).filter(Boolean);
    const vaccinations_required = newVaccinations.split(",").map((s) => s.trim()).filter(Boolean);
    const diet_supported = newDietSupported.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      await createRoom(hotelId, {
        title: newTitle,
        description: newDescription.trim() ? newDescription.trim() : null,
        price: Number(newPrice),
        quantity: Number(newQuantity),

        allowed_species: allowed_species.length ? allowed_species : null,
        temp_min: newTempMin === "" ? null : Number(newTempMin),
        temp_max: newTempMax === "" ? null : Number(newTempMax),
        humidity_min: newHumMin === "" ? null : Number(newHumMin),
        humidity_max: newHumMax === "" ? null : Number(newHumMax),

        room_conditions: newRoomConditions.trim() ? newRoomConditions.trim() : null,
        vaccinations_required: vaccinations_required.length ? vaccinations_required : null,
        chip_required: newChipRequired,

        diet_supported: diet_supported.length ? diet_supported : null,
        feedings_per_day_max: newFeedingsMax === "" ? null : Number(newFeedingsMax),

        license_required: newLicenseRequired,
        cohabitation_allowed: newCohabAllowed,
      });

      // reset
      setNewTitle("");
      setNewPrice("");
      setNewQuantity("");
      setNewDescription("");

      setNewAllowedSpecies("");
      setNewTempMin("");
      setNewTempMax("");
      setNewHumMin("");
      setNewHumMax("");

      setNewRoomConditions("");
      setNewVaccinations("");
      setNewChipRequired(false);

      setNewDietSupported("");
      setNewFeedingsMax("");

      setNewLicenseRequired(false);
      setNewCohabAllowed(true);

      await loadRooms();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при добавлении комнаты");
    }
  };

  const startEditRoom = (room: Room) => {
    setEditingId(room.id);

    setEditTitle(room.title);
    setEditDescription(room.description ?? "");

    setEditPrice(room.price);
    setEditQuantity(room.quantity);

    setEditAllowedSpecies((room.allowed_species ?? []).join(", "));
    setEditTempMin(room.temp_min ?? "");
    setEditTempMax(room.temp_max ?? "");
    setEditHumMin(room.humidity_min ?? "");
    setEditHumMax(room.humidity_max ?? "");

    setEditRoomConditions(room.room_conditions ?? "");
    setEditVaccinations((room.vaccinations_required ?? []).join(", "));
    setEditChipRequired(Boolean(room.chip_required));

    setEditDietSupported((room.diet_supported ?? []).join(", "));
    setEditFeedingsMax(room.feedings_per_day_max ?? "");

    setEditLicenseRequired(Boolean(room.license_required));
    setEditCohabAllowed(room.cohabitation_allowed ?? true);
  };

  const cancelEditRoom = () => {
    setEditingId(null);

    setEditTitle("");
    setEditDescription("");
    setEditPrice("");
    setEditQuantity("");

    setEditAllowedSpecies("");
    setEditTempMin("");
    setEditTempMax("");
    setEditHumMin("");
    setEditHumMax("");

    setEditRoomConditions("");
    setEditVaccinations("");
    setEditChipRequired(false);

    setEditDietSupported("");
    setEditFeedingsMax("");

    setEditLicenseRequired(false);
    setEditCohabAllowed(true);
  };

  const saveEditRoom = async () => {
    if (!editingId) return;

    const allowed_species = editAllowedSpecies.split(",").map((s) => s.trim()).filter(Boolean);
    const vaccinations_required = editVaccinations.split(",").map((s) => s.trim()).filter(Boolean);
    const diet_supported = editDietSupported.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      await updateRoom(hotelId, editingId, {
        title: editTitle,
        description: editDescription.trim() ? editDescription.trim() : null,

        price: editPrice === "" ? undefined : Number(editPrice),
        quantity: editQuantity === "" ? undefined : Number(editQuantity),

        allowed_species: allowed_species.length ? allowed_species : null,
        temp_min: editTempMin === "" ? null : Number(editTempMin),
        temp_max: editTempMax === "" ? null : Number(editTempMax),
        humidity_min: editHumMin === "" ? null : Number(editHumMin),
        humidity_max: editHumMax === "" ? null : Number(editHumMax),

        room_conditions: editRoomConditions.trim() ? editRoomConditions.trim() : null,
        vaccinations_required: vaccinations_required.length ? vaccinations_required : null,
        chip_required: editChipRequired,

        diet_supported: diet_supported.length ? diet_supported : null,
        feedings_per_day_max: editFeedingsMax === "" ? null : Number(editFeedingsMax),

        license_required: editLicenseRequired,
        cohabitation_allowed: editCohabAllowed,
      });

      await loadRooms();
      cancelEditRoom();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при изменении комнаты");
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Удалить комнату?")) return;
    try {
      await deleteRoom(hotelId, roomId);
      await loadRooms();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при удалении комнаты");
    }
  };

  // ---------- reviews actions ----------
  const handleCreateReview = async () => {
    if (reviewBookingId === "") {
      alert("Выбери бронирование");
      return;
    }
    if (!reviewText.trim()) {
      alert("Напиши текст отзыва");
      return;
    }

    try {
      await createReview({
        booking_id: Number(reviewBookingId),
        rating: Number(reviewRating),
        text: reviewText.trim(),
      });
      setReviewBookingId("");
      setReviewRating(5);
      setReviewText("");
      await loadReviews();
      alert("Отзыв отправлен");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? e?.message ?? "Ошибка при отправке отзыва");
    }
  };

  const handleReplyReview = async (reviewId: number) => {
    if (!replyText.trim()) {
      alert("Напиши ответ");
      return;
    }
    try {
      await replyReview(reviewId, { owner_reply: replyText.trim() });
      setReplyingReviewId(null);
      setReplyText("");
      await loadReviews();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? e?.message ?? "Ошибка при ответе");
    }
  };

  // ---------- render ----------
  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>Отель #{hotelId}</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          Дата заезда:
          <input
            type="date"
            value={dateFrom}
            min={today}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label style={{ marginLeft: 12 }}>
          Дата выезда:
          <input
            type="date"
            value={dateTo}
            min={dateFrom || today}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <h2>Комнаты</h2>

      <ul style={{ marginBottom: 20, paddingLeft: 18 }}>
        {rooms.map((r) => (
          <li key={r.id} style={{ marginBottom: 14 }}>
            {editingId === r.id ? (
              <div style={{ border: "1px solid #eee", padding: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Название"
                    style={{ width: 220 }}
                  />
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) =>
                      setEditPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Цена"
                    style={{ width: 120 }}
                  />
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) =>
                      setEditQuantity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Количество"
                    style={{ width: 140 }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Описание"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <input
                    value={editAllowedSpecies}
                    onChange={(e) => setEditAllowedSpecies(e.target.value)}
                    placeholder="Разрешённые виды (cat,dog,...)"
                    style={{ width: 300 }}
                  />
                  <input
                    type="number"
                    value={editTempMin}
                    onChange={(e) =>
                      setEditTempMin(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Темп. мин"
                    style={{ width: 120 }}
                  />
                  <input
                    type="number"
                    value={editTempMax}
                    onChange={(e) =>
                      setEditTempMax(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Темп. макс"
                    style={{ width: 120 }}
                  />
                  <input
                    type="number"
                    value={editHumMin}
                    onChange={(e) =>
                      setEditHumMin(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Влажн. мин"
                    style={{ width: 120 }}
                  />
                  <input
                    type="number"
                    value={editHumMax}
                    onChange={(e) =>
                      setEditHumMax(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Влажн. макс"
                    style={{ width: 120 }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <input
                    value={editRoomConditions}
                    onChange={(e) => setEditRoomConditions(e.target.value)}
                    placeholder="Условия комнаты"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                  <input
                    value={editVaccinations}
                    onChange={(e) => setEditVaccinations(e.target.value)}
                    placeholder="Прививки (rabies,complex...)"
                    style={{ width: 340 }}
                  />
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    Чип обязателен:
                    <input
                      type="checkbox"
                      checked={editChipRequired}
                      onChange={(e) => setEditChipRequired(e.target.checked)}
                    />
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                  <input
                    value={editDietSupported}
                    onChange={(e) => setEditDietSupported(e.target.value)}
                    placeholder="Диеты (dry,natural...)"
                    style={{ width: 340 }}
                  />
                  <input
                    type="number"
                    value={editFeedingsMax}
                    onChange={(e) =>
                      setEditFeedingsMax(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Макс. кормлений/день"
                    style={{ width: 220 }}
                  />
                </div>

                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 8 }}>
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    Лицензия нужна:
                    <input
                      type="checkbox"
                      checked={editLicenseRequired}
                      onChange={(e) => setEditLicenseRequired(e.target.checked)}
                    />
                  </label>

                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    Совместно можно:
                    <input
                      type="checkbox"
                      checked={editCohabAllowed}
                      onChange={(e) => setEditCohabAllowed(e.target.checked)}
                    />
                  </label>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={saveEditRoom} style={{ marginRight: 6 }}>
                    Сохранить
                  </button>
                  <button onClick={cancelEditRoom}>Отмена</button>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <b>{r.title}</b> – {r.price}₽ – осталось {r.available ?? r.quantity}
                  <button
                    onClick={() => handleBook(r.id)}
                    disabled={bookingRoomId === r.id}
                    style={{ marginLeft: 10 }}
                  >
                    {bookingRoomId === r.id ? "Бронирую..." : "Забронировать"}
                  </button>

                  {isAdmin && (
                    <>
                      <button style={{ marginLeft: 10 }} onClick={() => startEditRoom(r)}>
                        Изменить
                      </button>
                      <button style={{ marginLeft: 10 }} onClick={() => handleDeleteRoom(r.id)}>
                        Удалить
                      </button>
                    </>
                  )}
                </div>

                {/* подробности */}
                <div style={{ marginTop: 6, paddingLeft: 10, color: "#444" }}>
                  {r.description && (
                    <div>
                      <span style={{ color: "gray" }}>Описание:</span> {r.description}
                    </div>
                  )}
                  {r.room_conditions && (
                    <div>
                      <span style={{ color: "gray" }}>Условия:</span> {r.room_conditions}
                    </div>
                  )}
                  {Array.isArray(r.allowed_species) && r.allowed_species.length > 0 && (
                    <div>
                      <span style={{ color: "gray" }}>Животные:</span> {r.allowed_species.join(", ")}
                    </div>
                  )}
                  {(r.temp_min != null || r.temp_max != null) && (
                    <div>
                      <span style={{ color: "gray" }}>Температура:</span>{" "}
                      {r.temp_min != null ? `от ${r.temp_min}` : "—"}{" "}
                      {r.temp_max != null ? `до ${r.temp_max}` : "—"} °C
                    </div>
                  )}
                  {(r.humidity_min != null || r.humidity_max != null) && (
                    <div>
                      <span style={{ color: "gray" }}>Влажность:</span>{" "}
                      {r.humidity_min != null ? `от ${r.humidity_min}` : "—"}{" "}
                      {r.humidity_max != null ? `до ${r.humidity_max}` : "—"} %
                    </div>
                  )}
                  {Array.isArray(r.vaccinations_required) && r.vaccinations_required.length > 0 && (
                    <div>
                      <span style={{ color: "gray" }}>Прививки:</span>{" "}
                      {r.vaccinations_required.join(", ")}
                    </div>
                  )}
                  {r.chip_required != null && (
                    <div>
                      <span style={{ color: "gray" }}>Чип:</span>{" "}
                      {r.chip_required ? "обязателен" : "не нужен"}
                    </div>
                  )}
                  {Array.isArray(r.diet_supported) && r.diet_supported.length > 0 && (
                    <div>
                      <span style={{ color: "gray" }}>Диета:</span> {r.diet_supported.join(", ")}
                    </div>
                  )}
                  {r.feedings_per_day_max != null && (
                    <div>
                      <span style={{ color: "gray" }}>Кормлений/день (макс):</span>{" "}
                      {r.feedings_per_day_max}
                    </div>
                  )}
                  {r.license_required != null && (
                    <div>
                      <span style={{ color: "gray" }}>Лицензия:</span>{" "}
                      {r.license_required ? "нужна" : "не нужна"}
                    </div>
                  )}
                  {r.cohabitation_allowed != null && (
                    <div>
                      <span style={{ color: "gray" }}>Совместно:</span>{" "}
                      {r.cohabitation_allowed ? "можно" : "нельзя"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* ---------- Reviews ---------- */}
      <div style={{ marginTop: 30, borderTop: "1px solid #eee", paddingTop: 20 }}>
        <h2>Отзывы</h2>

        <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Оставить отзыв</h4>

          {myBookingsForThisHotel.length === 0 ? (
            <p style={{ color: "gray" }}>
              У тебя нет бронирований для этого отеля — отзыв оставить нельзя.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <label>
                  Бронирование:
                  <select
                    value={reviewBookingId}
                    onChange={(e) =>
                      setReviewBookingId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    style={{ marginLeft: 8, minWidth: 260 }}
                  >
                    <option value="">— выбери —</option>
                    {myBookingsForThisHotel.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} (room_id={b.room_id}) {b.date_from} → {b.date_to}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Оценка:
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    style={{ marginLeft: 8 }}
                  >
                    {[5, 4, 3, 2, 1].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 10 }}>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Текст отзыва..."
                  style={{ width: "100%", minHeight: 80 }}
                />
              </div>

              <button style={{ marginTop: 10 }} onClick={handleCreateReview}>
                Отправить отзыв
              </button>
            </>
          )}
        </div>

        {reviews.length === 0 ? (
          <p style={{ color: "gray" }}>Пока нет отзывов.</p>
        ) : (
          <ul style={{ paddingLeft: 16 }}>
            {reviews.map((r) => (
              <li key={r.id} style={{ marginBottom: 16 }}>
                <div>
                  <b>Оценка: {r.rating}/5</b>{" "}
                  <span style={{ color: "gray" }}>
                    — {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ marginTop: 4 }}>{r.text}</div>

                {r.owner_reply && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      background: "#fafafa",
                      border: "1px solid #eee",
                    }}
                  >
                    <b>Ответ отеля:</b>
                    <div style={{ marginTop: 4 }}>{r.owner_reply}</div>
                  </div>
                )}

                {isAdmin && (
                  <div style={{ marginTop: 8 }}>
                    {replyingReviewId === r.id ? (
                      <div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Ответ владельца/админа..."
                          style={{ width: "100%", minHeight: 60 }}
                        />
                        <button
                          onClick={() => handleReplyReview(r.id)}
                          style={{ marginRight: 6 }}
                        >
                          Отправить ответ
                        </button>
                        <button
                          onClick={() => {
                            setReplyingReviewId(null);
                            setReplyText("");
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingReviewId(r.id);
                          setReplyText("");
                        }}
                      >
                        Ответить
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- Admin create room ---------- */}
      {isAdmin && (
        <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 26 }}>
          <h3>Добавить комнату</h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Название"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: 220 }}
            />

            <input
              placeholder="Цена"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 120 }}
            />

            <input
              placeholder="Количество"
              type="number"
              value={newQuantity}
              onChange={(e) =>
                setNewQuantity(e.target.value === "" ? "" : Number(e.target.value))
              }
              style={{ width: 140 }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              placeholder="Описание"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <input
              placeholder="Разрешённые виды (cat,dog...)"
              value={newAllowedSpecies}
              onChange={(e) => setNewAllowedSpecies(e.target.value)}
              style={{ width: 300 }}
            />

            <input
              placeholder="Темп. мин"
              type="number"
              value={newTempMin}
              onChange={(e) => setNewTempMin(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 120 }}
            />
            <input
              placeholder="Темп. макс"
              type="number"
              value={newTempMax}
              onChange={(e) => setNewTempMax(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 120 }}
            />

            <input
              placeholder="Влажн. мин"
              type="number"
              value={newHumMin}
              onChange={(e) => setNewHumMin(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 120 }}
            />
            <input
              placeholder="Влажн. макс"
              type="number"
              value={newHumMax}
              onChange={(e) => setNewHumMax(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 120 }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              placeholder="Условия комнаты"
              value={newRoomConditions}
              onChange={(e) => setNewRoomConditions(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
            <input
              placeholder="Требуемые прививки (rabies,complex...)"
              value={newVaccinations}
              onChange={(e) => setNewVaccinations(e.target.value)}
              style={{ width: 340 }}
            />

            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Чип обязателен:
              <input
                type="checkbox"
                checked={newChipRequired}
                onChange={(e) => setNewChipRequired(e.target.checked)}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
            <input
              placeholder="Диеты (dry,natural...)"
              value={newDietSupported}
              onChange={(e) => setNewDietSupported(e.target.value)}
              style={{ width: 340 }}
            />

            <input
              placeholder="Макс. кормлений/день"
              type="number"
              value={newFeedingsMax}
              onChange={(e) =>
                setNewFeedingsMax(e.target.value === "" ? "" : Number(e.target.value))
              }
              style={{ width: 220 }}
            />
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Лицензия нужна:
              <input
                type="checkbox"
                checked={newLicenseRequired}
                onChange={(e) => setNewLicenseRequired(e.target.checked)}
              />
            </label>

            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Совместно можно:
              <input
                type="checkbox"
                checked={newCohabAllowed}
                onChange={(e) => setNewCohabAllowed(e.target.checked)}
              />
            </label>
          </div>

          <button onClick={handleCreateRoom} style={{ marginTop: 12 }}>
            Добавить комнату
          </button>
        </div>
      )}
    </div>
  );
}