import "./HotelPage.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getRooms, createRoom, deleteRoom, updateRoom } from "../api/rooms";
import type { Room } from "../api/rooms";

import { createBooking, getMyBookings } from "../api/bookings";
import type { Booking } from "../api/bookings";

import { getMe } from "../api/auth";
import { getHotels } from "../api/hotels";
import type { Hotel } from "../api/hotels";

import { getHotelReviews, createReview, replyReview } from "../api/reviews";
import type { ReviewOut } from "../api/reviews";

export default function HotelPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hotelId = Number(id);

  const today = new Date().toISOString().slice(0, 10);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [isHotelOwner, setIsHotelOwner] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);

  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  const [reviewBookingId, setReviewBookingId] = useState<number | "">("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");

  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>("");

  const roomIdSet = useMemo(() => new Set(rooms.map((r) => r.id)), [rooms]);

  const myBookingsForThisHotel = useMemo(() => {
    return myBookings.filter((b) => roomIdSet.has(b.room_id));
  }, [myBookings, roomIdSet]);

  const isOwnerOfThisHotel =
    isHotelOwner && hotel?.owner_id != null && hotel.owner_id === myUserId;

  const canManageRooms = isAdmin || isOwnerOfThisHotel;

  const checkMe = async () => {
    try {
      const me = await getMe();
      setIsAdmin(me.is_admin === true);
      setIsHotelOwner(me.is_hotel_owner === true);
      setMyUserId(me.id);
    } catch {
      setIsAdmin(false);
      setIsHotelOwner(false);
      setMyUserId(null);
    }
  };

  const loadHotel = async () => {
    try {
      const data = await getHotels({ id: hotelId });
      const currentHotel = Array.isArray(data) ? data[0] ?? null : null;
      setHotel(currentHotel);
    } catch (e) {
      console.error("loadHotel failed:", e);
      setHotel(null);
    }
  };

  const loadRooms = async () => {
    try {
      const params =
        !isOwnerOfThisHotel && dateFrom && dateTo
          ? { date_from: dateFrom, date_to: dateTo }
          : undefined;

      const data = await getRooms(hotelId, params);
      setRooms(data);

      if (!data.length) {
        setMessage("Для этого отеля пока нет доступных комнат.");
      } else {
        setMessage(null);
      }
    } catch (e) {
      console.error("loadRooms failed:", e);
      setRooms([]);
      setMessage("Ошибка при загрузке комнат.");
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

  useEffect(() => {
    if (!hotelId || Number.isNaN(hotelId)) return;

    const init = async () => {
      await checkMe();
      await loadHotel();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  useEffect(() => {
    if (!hotelId || Number.isNaN(hotelId)) return;

    loadRooms();

    if (!isOwnerOfThisHotel) {
      loadReviews();
      loadMyBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, isOwnerOfThisHotel]);

  useEffect(() => {
    if (!hotelId || Number.isNaN(hotelId)) return;
    if (isOwnerOfThisHotel) return;
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, isOwnerOfThisHotel]);

  const handleBook = async (roomId: number) => {
    if (isOwnerOfThisHotel) return;

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
      await loadMyBookings();
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

    const allowed_species = newAllowedSpecies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const vaccinations_required = newVaccinations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const diet_supported = newDietSupported
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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

    const allowed_species = editAllowedSpecies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const vaccinations_required = editVaccinations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const diet_supported = editDietSupported
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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

  return (
    <div className="hotel-page">
      <div className="hotel-page__container">
        <section className="hotel-card hotel-hero">
          <div className="hotel-hero__top">
            <div>
              <h1 className="hotel-hero__title">{hotel?.title ?? "Отель"}</h1>
              <p className="hotel-hero__subtitle">
                {isOwnerOfThisHotel
                  ? "Управление комнатами вашего отеля"
                  : "Комнаты, бронирование и отзывы об отеле"}
              </p>
            </div>

            <div className="hotel-actions">
              <button
                type="button"
                className="hotel-btn hotel-btn--ghost"
                onClick={() => navigate("/")}
              >
                К отелям
              </button>

              {!isOwnerOfThisHotel && (
                <button
                  type="button"
                  className="hotel-btn hotel-btn--secondary"
                  onClick={() => navigate("/bookings")}
                >
                  Мои бронирования
                </button>
              )}
            </div>
          </div>
        </section>

        {!isOwnerOfThisHotel && (
          <section className="hotel-card">
            <h2 className="hotel-section-title">Даты бронирования</h2>

            <div className="hotel-form-grid">
              <div className="hotel-field">
                <label className="hotel-label">Дата заезда</label>
                <input
                  className="hotel-input"
                  type="date"
                  value={dateFrom}
                  min={today}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Дата выезда</label>
                <input
                  className="hotel-input"
                  type="date"
                  value={dateTo}
                  min={dateFrom || today}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {message && <div className="hotel-message">{message}</div>}

        <section className="hotel-card">
          <h2 className="hotel-section-title">Комнаты</h2>

          <div className="hotel-rooms-list">
            {rooms.map((r) => (
              <article key={r.id} className="hotel-room-card">
                {editingId === r.id ? (
                  <>
                    <h3 className="hotel-room-card__title">Редактирование комнаты</h3>

                    <div className="hotel-form-grid">
                      <div className="hotel-field">
                        <label className="hotel-label">Название</label>
                        <input
                          className="hotel-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Цена</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editPrice}
                          onChange={(e) =>
                            setEditPrice(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Количество</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editQuantity}
                          onChange={(e) =>
                            setEditQuantity(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="hotel-field hotel-field--wide">
                        <label className="hotel-label">Описание</label>
                        <textarea
                          className="hotel-textarea"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>

                      <div className="hotel-field hotel-field--wide">
                        <label className="hotel-label">Разрешённые виды</label>
                        <input
                          className="hotel-input"
                          value={editAllowedSpecies}
                          onChange={(e) => setEditAllowedSpecies(e.target.value)}
                          placeholder="cat, dog..."
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Темп. мин</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editTempMin}
                          onChange={(e) =>
                            setEditTempMin(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Темп. макс</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editTempMax}
                          onChange={(e) =>
                            setEditTempMax(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Влажн. мин</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editHumMin}
                          onChange={(e) =>
                            setEditHumMin(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Влажн. макс</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editHumMax}
                          onChange={(e) =>
                            setEditHumMax(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="hotel-field hotel-field--wide">
                        <label className="hotel-label">Условия комнаты</label>
                        <input
                          className="hotel-input"
                          value={editRoomConditions}
                          onChange={(e) => setEditRoomConditions(e.target.value)}
                        />
                      </div>

                      <div className="hotel-field hotel-field--wide">
                        <label className="hotel-label">Прививки</label>
                        <input
                          className="hotel-input"
                          value={editVaccinations}
                          onChange={(e) => setEditVaccinations(e.target.value)}
                          placeholder="rabies, complex"
                        />
                      </div>

                      <div className="hotel-field hotel-field--wide">
                        <label className="hotel-label">Поддерживаемые диеты</label>
                        <input
                          className="hotel-input"
                          value={editDietSupported}
                          onChange={(e) => setEditDietSupported(e.target.value)}
                        />
                      </div>

                      <div className="hotel-field">
                        <label className="hotel-label">Макс. кормлений/день</label>
                        <input
                          className="hotel-input"
                          type="number"
                          value={editFeedingsMax}
                          onChange={(e) =>
                            setEditFeedingsMax(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="hotel-checkbox-row">
                      <label className="hotel-checkbox">
                        <input
                          type="checkbox"
                          checked={editChipRequired}
                          onChange={(e) => setEditChipRequired(e.target.checked)}
                        />
                        Чип обязателен
                      </label>

                      <label className="hotel-checkbox">
                        <input
                          type="checkbox"
                          checked={editLicenseRequired}
                          onChange={(e) => setEditLicenseRequired(e.target.checked)}
                        />
                        Нужна лицензия
                      </label>

                      <label className="hotel-checkbox">
                        <input
                          type="checkbox"
                          checked={editCohabAllowed}
                          onChange={(e) => setEditCohabAllowed(e.target.checked)}
                        />
                        Совместное содержание
                      </label>
                    </div>

                    <div className="hotel-actions">
                      <button
                        type="button"
                        className="hotel-btn hotel-btn--primary"
                        onClick={saveEditRoom}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="hotel-btn hotel-btn--ghost"
                        onClick={cancelEditRoom}
                      >
                        Отмена
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hotel-room-card__top">
                      <div>
                        <h3 className="hotel-room-card__title">{r.title}</h3>
                        <p className="hotel-room-card__subtitle">
                          {r.price} ₽ · осталось {r.available ?? r.quantity}
                        </p>
                      </div>

                      <div className="hotel-actions">
                        {!isOwnerOfThisHotel && (
                          <button
                            type="button"
                            className="hotel-btn hotel-btn--primary"
                            onClick={() => handleBook(r.id)}
                            disabled={bookingRoomId === r.id}
                          >
                            {bookingRoomId === r.id ? "Бронирую..." : "Забронировать"}
                          </button>
                        )}

                        {canManageRooms && (
                          <>
                            <button
                              type="button"
                              className="hotel-btn hotel-btn--secondary"
                              onClick={() => startEditRoom(r)}
                            >
                              Изменить
                            </button>
                            <button
                              type="button"
                              className="hotel-btn hotel-btn--danger"
                              onClick={() => handleDeleteRoom(r.id)}
                            >
                              Удалить
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hotel-room-details">
                      {r.description && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Описание</div>
                          <div className="hotel-room-detail-box__value">{r.description}</div>
                        </div>
                      )}

                      {r.room_conditions && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Условия</div>
                          <div className="hotel-room-detail-box__value">{r.room_conditions}</div>
                        </div>
                      )}

                      {Array.isArray(r.allowed_species) && r.allowed_species.length > 0 && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Животные</div>
                          <div className="hotel-room-detail-box__value">
                            {r.allowed_species.join(", ")}
                          </div>
                        </div>
                      )}

                      {(r.temp_min != null || r.temp_max != null) && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Температура</div>
                          <div className="hotel-room-detail-box__value">
                            {r.temp_min != null ? `от ${r.temp_min}` : "—"}{" "}
                            {r.temp_max != null ? `до ${r.temp_max}` : "—"} °C
                          </div>
                        </div>
                      )}

                      {(r.humidity_min != null || r.humidity_max != null) && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Влажность</div>
                          <div className="hotel-room-detail-box__value">
                            {r.humidity_min != null ? `от ${r.humidity_min}` : "—"}{" "}
                            {r.humidity_max != null ? `до ${r.humidity_max}` : "—"} %
                          </div>
                        </div>
                      )}

                      {Array.isArray(r.vaccinations_required) &&
                        r.vaccinations_required.length > 0 && (
                          <div className="hotel-room-detail-box">
                            <div className="hotel-room-detail-box__label">Прививки</div>
                            <div className="hotel-room-detail-box__value">
                              {r.vaccinations_required.join(", ")}
                            </div>
                          </div>
                        )}

                      {r.chip_required != null && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Чип</div>
                          <div className="hotel-room-detail-box__value">
                            {r.chip_required ? "обязателен" : "не нужен"}
                          </div>
                        </div>
                      )}

                      {Array.isArray(r.diet_supported) && r.diet_supported.length > 0 && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Диета</div>
                          <div className="hotel-room-detail-box__value">
                            {r.diet_supported.join(", ")}
                          </div>
                        </div>
                      )}

                      {r.feedings_per_day_max != null && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">
                            Кормлений/день
                          </div>
                          <div className="hotel-room-detail-box__value">
                            {r.feedings_per_day_max}
                          </div>
                        </div>
                      )}

                      {r.license_required != null && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">Лицензия</div>
                          <div className="hotel-room-detail-box__value">
                            {r.license_required ? "нужна" : "не нужна"}
                          </div>
                        </div>
                      )}

                      {r.cohabitation_allowed != null && (
                        <div className="hotel-room-detail-box">
                          <div className="hotel-room-detail-box__label">
                            Совместное содержание
                          </div>
                          <div className="hotel-room-detail-box__value">
                            {r.cohabitation_allowed ? "можно" : "нельзя"}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>

        {!isOwnerOfThisHotel && (
          <section className="hotel-card">
            <h2 className="hotel-section-title">Отзывы</h2>

            <div className="hotel-review-create">
              <h3 className="hotel-subtitle">Оставить отзыв</h3>

              {myBookingsForThisHotel.length === 0 ? (
                <p className="hotel-muted">
                  У тебя нет бронирований для этого отеля — отзыв оставить нельзя.
                </p>
              ) : (
                <>
                  <div className="hotel-form-grid">
                    <div className="hotel-field">
                      <label className="hotel-label">Бронирование</label>
                      <select
                        className="hotel-input"
                        value={reviewBookingId}
                        onChange={(e) =>
                          setReviewBookingId(e.target.value === "" ? "" : Number(e.target.value))
                        }
                      >
                        <option value="">— выбери —</option>
                        {myBookingsForThisHotel.map((b) => (
                          <option key={b.id} value={b.id}>
                            #{b.id} (room_id={b.room_id}) {b.date_from} → {b.date_to}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hotel-field">
                      <label className="hotel-label">Оценка</label>
                      <select
                        className="hotel-input"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hotel-field hotel-field--wide">
                      <label className="hotel-label">Текст отзыва</label>
                      <textarea
                        className="hotel-textarea"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Текст отзыва..."
                      />
                    </div>
                  </div>

                  <div className="hotel-actions">
                    <button
                      type="button"
                      className="hotel-btn hotel-btn--primary"
                      onClick={handleCreateReview}
                    >
                      Отправить отзыв
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="hotel-reviews-list">
              {reviews.length === 0 ? (
                <p className="hotel-muted">Пока нет отзывов.</p>
              ) : (
                reviews.map((r) => (
                  <article key={r.id} className="hotel-review-card">
                    <div className="hotel-review-card__head">
                      <div className="hotel-review-card__rating">Оценка: {r.rating}/5</div>
                      <div className="hotel-review-card__date">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="hotel-review-card__text">{r.text}</div>

                    {r.owner_reply && (
                      <div className="hotel-review-reply">
                        <div className="hotel-review-reply__label">Ответ отеля</div>
                        <div>{r.owner_reply}</div>
                      </div>
                    )}

                    {canManageRooms && (
                      <div className="hotel-review-admin">
                        {replyingReviewId === r.id ? (
                          <>
                            <textarea
                              className="hotel-textarea"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Ответ владельца/админа..."
                            />
                            <div className="hotel-actions">
                              <button
                                type="button"
                                className="hotel-btn hotel-btn--primary"
                                onClick={() => handleReplyReview(r.id)}
                              >
                                Отправить ответ
                              </button>
                              <button
                                type="button"
                                className="hotel-btn hotel-btn--ghost"
                                onClick={() => {
                                  setReplyingReviewId(null);
                                  setReplyText("");
                                }}
                              >
                                Отмена
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="hotel-btn hotel-btn--secondary"
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
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {canManageRooms && (
          <section className="hotel-card">
            <h2 className="hotel-section-title">Добавить комнату</h2>

            <div className="hotel-form-grid">
              <div className="hotel-field">
                <label className="hotel-label">Название</label>
                <input
                  className="hotel-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Цена</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Количество</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newQuantity}
                  onChange={(e) =>
                    setNewQuantity(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <div className="hotel-field hotel-field--wide">
                <label className="hotel-label">Описание</label>
                <textarea
                  className="hotel-textarea"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="hotel-field hotel-field--wide">
                <label className="hotel-label">Разрешённые виды</label>
                <input
                  className="hotel-input"
                  value={newAllowedSpecies}
                  onChange={(e) => setNewAllowedSpecies(e.target.value)}
                  placeholder="cat, dog..."
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Темп. мин</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newTempMin}
                  onChange={(e) => setNewTempMin(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Темп. макс</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newTempMax}
                  onChange={(e) => setNewTempMax(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Влажн. мин</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newHumMin}
                  onChange={(e) => setNewHumMin(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Влажн. макс</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newHumMax}
                  onChange={(e) => setNewHumMax(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotel-field hotel-field--wide">
                <label className="hotel-label">Условия комнаты</label>
                <input
                  className="hotel-input"
                  value={newRoomConditions}
                  onChange={(e) => setNewRoomConditions(e.target.value)}
                />
              </div>

              <div className="hotel-field hotel-field--wide">
                <label className="hotel-label">Требуемые прививки</label>
                <input
                  className="hotel-input"
                  value={newVaccinations}
                  onChange={(e) => setNewVaccinations(e.target.value)}
                />
              </div>

              <div className="hotel-field hotel-field--wide">
                <label className="hotel-label">Диеты</label>
                <input
                  className="hotel-input"
                  value={newDietSupported}
                  onChange={(e) => setNewDietSupported(e.target.value)}
                />
              </div>

              <div className="hotel-field">
                <label className="hotel-label">Макс. кормлений/день</label>
                <input
                  className="hotel-input"
                  type="number"
                  value={newFeedingsMax}
                  onChange={(e) =>
                    setNewFeedingsMax(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="hotel-checkbox-row">
              <label className="hotel-checkbox">
                <input
                  type="checkbox"
                  checked={newChipRequired}
                  onChange={(e) => setNewChipRequired(e.target.checked)}
                />
                Чип обязателен
              </label>

              <label className="hotel-checkbox">
                <input
                  type="checkbox"
                  checked={newLicenseRequired}
                  onChange={(e) => setNewLicenseRequired(e.target.checked)}
                />
                Нужна лицензия
              </label>

              <label className="hotel-checkbox">
                <input
                  type="checkbox"
                  checked={newCohabAllowed}
                  onChange={(e) => setNewCohabAllowed(e.target.checked)}
                />
                Совместное содержание
              </label>
            </div>

            <div className="hotel-actions">
              <button
                type="button"
                className="hotel-btn hotel-btn--primary"
                onClick={handleCreateRoom}
              >
                Добавить комнату
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}