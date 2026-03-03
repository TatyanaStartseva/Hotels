// src/pages/HotelPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRooms, createRoom, deleteRoom, updateRoom } from "../api/rooms";
import { createBooking } from "../api/bookings";
import { getMe } from "../api/auth";
import type { Room } from "../api/rooms";

export default function HotelPage() {
  const { id } = useParams<{ id: string }>();
  const hotelId = Number(id);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [isAdmin, setIsAdmin] = useState(false);

  // добавление комнаты
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

  // редактирование
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

  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);

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

      await createBooking({
        room_id: roomId,
        date_from: dateFrom,
        date_to: dateTo,
      });

      await loadRooms();
      alert("Бронь создана");
    } catch (e: any) {
      console.error("createBooking failed:", e);
      alert(e?.message ?? "Ошибка при бронировании");
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

      // очистка
      setNewTitle("");
      setNewDescription("");
      setNewPrice("");
      setNewQuantity("");

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
            min={today}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label style={{ marginLeft: 10 }}>
          Дата выезда:
          <input
            type="date"
            value={dateTo}
            min={dateFrom || today}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>

      <h2>Комнаты</h2>

      <ul style={{ marginBottom: 20 }}>
        {rooms.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            {editingId === r.id ? (
              <div style={{ border: "1px solid #eee", padding: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Название"
                    style={{ width: 200 }}
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
                    style={{ width: 260 }}
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
                    placeholder="Условия комнаты (террариум, тишина...)"
                    style={{ width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    value={editVaccinations}
                    onChange={(e) => setEditVaccinations(e.target.value)}
                    placeholder="Прививки (rabies,complex...)"
                    style={{ width: 320 }}
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

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    value={editDietSupported}
                    onChange={(e) => setEditDietSupported(e.target.value)}
                    placeholder="Диеты (dry,natural...)"
                    style={{ width: 320 }}
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

                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    flexWrap: "wrap",
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
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

                {/* подробности номера */}
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
                      <span style={{ color: "gray" }}>Животные:</span>{" "}
                      {r.allowed_species.join(", ")}
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
                      <span style={{ color: "gray" }}>Диета:</span>{" "}
                      {r.diet_supported.join(", ")}
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

      {/* добавление комнаты — только админ */}
      {isAdmin && (
        <div style={{ border: "1px solid #ccc", padding: 12 }}>
          <h3>Добавить комнату</h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Название"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: 200 }}
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
              onChange={(e) => setNewQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 140 }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              placeholder="Описание (опционально)"
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
              style={{ width: 260 }}
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
              placeholder="Условия комнаты (террариум, тишина...)"
              value={newRoomConditions}
              onChange={(e) => setNewRoomConditions(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <input
              placeholder="Требуемые прививки (rabies,complex...)"
              value={newVaccinations}
              onChange={(e) => setNewVaccinations(e.target.value)}
              style={{ width: 300 }}
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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <input
              placeholder="Поддерживаемая диета (dry,natural...)"
              value={newDietSupported}
              onChange={(e) => setNewDietSupported(e.target.value)}
              style={{ width: 300 }}
            />

            <input
              placeholder="Макс. кормлений/день"
              type="number"
              value={newFeedingsMax}
              onChange={(e) => setNewFeedingsMax(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: 200 }}
            />
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
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