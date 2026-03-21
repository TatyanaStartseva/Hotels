// src/pages/HotelsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getHotels,
  createHotel,
  deleteHotel,
  updateHotel,
} from "../api/hotels";
import type { Hotel } from "../api/hotels";
import { Link, useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";
import { getMyPets, type Pet } from "../api/pets";
import { searchRooms, type RoomSearchOut } from "../api/roomsSearch";

type SpeciesOption = { label: string; value: string };
type ConditionOption = { label: string; value: string };

const SPECIES_OPTIONS: SpeciesOption[] = [
  { label: "— не выбрано —", value: "" },
  { label: "Кошка", value: "cat" },
  { label: "Собака", value: "dog" },
  { label: "Кролик", value: "rabbit" },
  { label: "Грызун", value: "rodent" },
  { label: "Птица", value: "bird" },
  { label: "Змея", value: "snake" },
  { label: "Рептилия", value: "reptile" },
  { label: "Паук", value: "spider" },
];

const CONDITIONS_OPTIONS: ConditionOption[] = [
  { label: "— не выбрано —", value: "" },
  { label: "Обычные условия (без особых требований)", value: "standard" },
  { label: "Террариум обязателен", value: "terrarium" },
  { label: "Подогрев / УФ-лампа", value: "heating_uv" },
  { label: "Тихое место (без шума)", value: "quiet" },
  { label: "Без сквозняков", value: "no_draft" },
  { label: "Можно совместно содержать", value: "cohab" },
  { label: "Только одиночное содержание", value: "solo" },
];

function conditionValueToText(v: string): string {
  // что отправим на бэк в параметр conditions (текст, который можно искать в room_conditions)
  switch (v) {
    case "standard":
      return "стандарт";
    case "terrarium":
      return "террариум";
    case "heating_uv":
      return "подогрев";
    case "quiet":
      return "тихо";
    case "no_draft":
      return "сквозняк";
    case "cohab":
      return "совмест";
    case "solo":
      return "одиноч";
    default:
      return "";
  }
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // состояние для редактирования
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  //  питомцы и требования
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | "">("");

  // Вид и условия — теперь селекты
  const [species, setSpecies] = useState<string>(""); // cat/dog...
  const [conditionsKey, setConditionsKey] = useState<string>(""); // enum key

  // прочие фильтры
  const [tMin, setTMin] = useState<number | "">("");
  const [tMax, setTMax] = useState<number | "">("");
  const [hMin, setHMin] = useState<number | "">("");
  const [hMax, setHMax] = useState<number | "">("");

  const [vaccinationsText, setVaccinationsText] = useState(""); // "rabies, complex"
  const [licenseRequired, setLicenseRequired] = useState<boolean | "">("");
  const [cohabAllowed, setCohabAllowed] = useState<boolean | "">("");

  const [dietType, setDietType] = useState("");
  const [dietDetails, setDietDetails] = useState("");
  const [feedings, setFeedings] = useState<number | "">("");

  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
    checkMe();
    loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkMe = async () => {
    try {
      const me = await getMe();
      setIsLogged(true);
      setIsAdmin(me.is_admin === true);
      console.log("ME:", me);
    } catch (e) {
      console.log("Не залогинен или ошибка /auth/me", e);
      setIsLogged(false);
      setIsAdmin(false);
    }
  };

  const loadPets = async () => {
    try {
      const data = await getMyPets();
      setPets(data);
    } catch (e) {
      console.log("pets: not authenticated or error", e);
      setPets([]);
    }
  };

  // если выбрали питомца — подставим значения (НО пользователь может менять)
  useEffect(() => {
    if (!selectedPetId) return;
    const pet = pets.find((p) => p.id === selectedPetId);
    if (!pet) return;

    // @ts-ignore - если в твоём Pet пока нет species, оставь пустым или добавь на бэке
    setSpecies((pet as any).species ?? "");

    setTMin(pet.temperature_min ?? "");
    setTMax(pet.temperature_max ?? "");
    setHMin(pet.humidity_min ?? "");
    setHMax(pet.humidity_max ?? "");

    // условия питомца (текст) пытаемся сопоставить с ключом
    const c = (pet.conditions ?? "").toLowerCase();
    if (c.includes("терра")) setConditionsKey("terrarium");
    else if (c.includes("подог") || c.includes("уф")) setConditionsKey("heating_uv");
    else if (c.includes("тих")) setConditionsKey("quiet");
    else if (c.includes("сквоз")) setConditionsKey("no_draft");
    else if (c.includes("один")) setConditionsKey("solo");
    else if (c.includes("совмест")) setConditionsKey("cohab");
    else setConditionsKey("");

    setDietType(pet.diet_type ?? "");
    setDietDetails(pet.diet_details ?? "");
    setFeedings(pet.feedings_per_day ?? "");

    setLicenseRequired(pet.license_required ? true : false);
    setCohabAllowed(pet.cohabitation_allowed ?? "");

    const v = (pet.vaccinations ?? []) as any[];
    const names =
      v.length && typeof v[0] === "string"
        ? (v as string[])
        : v.map((x) => (x?.name ? String(x.name) : "")).filter(Boolean);
    setVaccinationsText(names.join(", "));
  }, [selectedPetId, pets]);

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

  // ✅ включён ли фильтр питомца
  const petFiltersEnabled = useMemo(() => {
    if (selectedPetId) return true;
    if (species) return true;
    if (conditionsKey) return true;
    if (tMin !== "" || tMax !== "" || hMin !== "" || hMax !== "") return true;
    if (dietType || dietDetails) return true;
    if (feedings !== "") return true;
    if (vaccinationsText.trim()) return true;
    if (licenseRequired !== "" || cohabAllowed !== "") return true;
    return false;
  }, [
    selectedPetId,
    species,
    conditionsKey,
    tMin,
    tMax,
    hMin,
    hMax,
    dietType,
    dietDetails,
    feedings,
    vaccinationsText,
    licenseRequired,
    cohabAllowed,
  ]);

  const buildPetParams = () => {
    const params: Record<string, any> = {};

    if (selectedPetId) params.pet_id = selectedPetId;

    if (species) params.species = species;

    if (tMin !== "") params.temperature_min = Number(tMin);
    if (tMax !== "") params.temperature_max = Number(tMax);
    if (hMin !== "") params.humidity_min = Number(hMin);
    if (hMax !== "") params.humidity_max = Number(hMax);

    const conditionsText = conditionValueToText(conditionsKey);
    if (conditionsText) params.conditions = conditionsText;

    if (dietType) params.diet_type = dietType;
    if (dietDetails) params.diet_details = dietDetails;
    if (feedings !== "") params.feedings_per_day = Number(feedings);

    if (licenseRequired !== "") params.license_required = licenseRequired;
    if (cohabAllowed !== "") params.cohabitation_allowed = cohabAllowed;

    const vacc = vaccinationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (vacc.length) params.vaccinations = vacc;

    return params;
  };

  const hotelsFromRoomsSearch = (rooms: RoomSearchOut[]): Hotel[] => {
    const map = new Map<number, Hotel>();

    for (const r of rooms) {
      const h = r.hotel;

      const titleValue =
        (h as any).title ?? (h as any).name ?? `Отель #${h.id}`;
      const locationValue = (h as any).location ?? "";

      if (!map.has(h.id)) {
        map.set(h.id, {
          id: h.id,
          title: titleValue,
          location: locationValue,
        } as Hotel);
      }
    }
    return Array.from(map.values());
  };

  const searchByCity = async () => {
    setMessage(null);
    const text = city.trim();
    if (!text) {
      await loadAll();
      return;
    }

    try {
      if (petFiltersEnabled) {
        const params = buildPetParams();
        params.q = text;
        const rooms = await searchRooms(params);
        const filteredHotels = hotelsFromRoomsSearch(rooms);
        setHotels(filteredHotels);

        if (filteredHotels.length === 0) {
          setMessage("Подходящих отелей по условиям питомца в этом городе не найдено.");
        }
        return;
      }

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
      if (petFiltersEnabled) {
        const params = buildPetParams();
        params.q = text;
        const rooms = await searchRooms(params);
        const filteredHotels = hotelsFromRoomsSearch(rooms);
        setHotels(filteredHotels);

        if (filteredHotels.length === 0) {
          setMessage("Подходящих отелей по условиям питомца с таким названием не найдено.");
        }
        return;
      }

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
    const url = newImageUrl.trim();

    await createHotel({
      title: newTitle,
      location: newLocation,
      images: url ? [url] : [],
    });

    setNewTitle("");
    setNewLocation("");
    setNewImageUrl("");
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

  const firstImg =
    (hotel as any).images && (hotel as any).images.length ? (hotel as any).images[0] : "";
  setEditImageUrl(firstImg);
};

  const cancelEdit = () => {
  setEditingId(null);
  setEditTitle("");
  setEditLocation("");
  setEditImageUrl("");
};
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const url = editImageUrl.trim();

await updateHotel(editingId, {
  title: editTitle,
  location: editLocation,
  images: url ? [url] : [],
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

  const clearPetFilter = () => {
    setSelectedPetId("");
    setSpecies("");
    setConditionsKey("");
    setTMin("");
    setTMax("");
    setHMin("");
    setHMax("");
    setVaccinationsText("");
    setLicenseRequired("");
    setCohabAllowed("");
    setDietType("");
    setDietDetails("");
    setFeedings("");
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
            <button
    onClick={() => navigate("/pets")}
    style={{ marginRight: 10 }}
  >
    Мои питомцы
  </button>
          <button onClick={() => navigate("/bookings")}>
            Мои бронирования
          </button>
        </div>
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

      {/* ✅ Фильтр по требованиям питомца */}
      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Фильтр по требованиям питомца</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            Питомец:
            <select
              value={selectedPetId}
              onChange={(e) =>
                setSelectedPetId(e.target.value === "" ? "" : Number(e.target.value))
              }
              style={{ marginLeft: 8, minWidth: 280 }}
            >
              <option value="">— не выбран (ввод вручную) —</option>
              {pets.map((p) => {
  const speciesLabel =
    p.species === "cat" ? "Кошка" :
    p.species === "dog" ? "Собака" :
    p.species === "rabbit" ? "Кролик" :
    p.species === "rodent" ? "Грызун" :
    p.species === "bird" ? "Птица" :
    p.species === "snake" ? "Змея" :
    p.species === "reptile" ? "Рептилия" :
    p.species === "spider" ? "Паук" :
    "Питомец";

  return (
    <option key={p.id} value={p.id}>
      {p.name} — {speciesLabel}
      {p.conditions ? ` (${p.conditions})` : ""}
    </option>
  );
})}
            </select>
          </label>

          <button style={{ marginLeft: 10 }} onClick={clearPetFilter}>
            Очистить фильтр
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <label>
            Вид животного:
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              style={{ marginLeft: 8, width: 220 }}
            >
              {SPECIES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Условия:
            <select
              value={conditionsKey}
              onChange={(e) => setConditionsKey(e.target.value)}
              style={{ marginLeft: 8, width: 260 }}
            >
              {CONDITIONS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <input
            placeholder="Темп. мин"
            type="number"
            value={tMin}
            onChange={(e) => setTMin(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 120 }}
          />
          <input
            placeholder="Темп. макс"
            type="number"
            value={tMax}
            onChange={(e) => setTMax(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 120 }}
          />

          <input
            placeholder="Влажн. мин"
            type="number"
            value={hMin}
            onChange={(e) => setHMin(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 120 }}
          />
          <input
            placeholder="Влажн. макс"
            type="number"
            value={hMax}
            onChange={(e) => setHMax(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 120 }}
          />

          <input
            placeholder="Прививки (через запятую)"
            value={vaccinationsText}
            onChange={(e) => setVaccinationsText(e.target.value)}
            style={{ width: 260 }}
          />

          <input
            placeholder="Диета (тип)"
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            style={{ width: 180 }}
          />

          <input
            placeholder="Особенности питания"
            value={dietDetails}
            onChange={(e) => setDietDetails(e.target.value)}
            style={{ width: 220 }}
          />

          <input
            placeholder="Кормлений/день"
            type="number"
            value={feedings}
            onChange={(e) =>
              setFeedings(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={{ width: 160 }}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Лицензия:
            <select
              value={licenseRequired === "" ? "" : licenseRequired ? "true" : "false"}
              onChange={(e) =>
                setLicenseRequired(e.target.value === "" ? "" : e.target.value === "true")
              }
            >
              <option value="">—</option>
              <option value="false">Не нужна</option>
              <option value="true">Нужна</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Совместно:
            <select
              value={cohabAllowed === "" ? "" : cohabAllowed ? "true" : "false"}
              onChange={(e) =>
                setCohabAllowed(e.target.value === "" ? "" : e.target.value === "true")
              }
            >
              <option value="">—</option>
              <option value="true">Можно</option>
              <option value="false">Нельзя</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 8, color: "gray", fontSize: 12 }}>
          Фильтр применяется при нажатии кнопок <b>“Найти по городу”</b> / <b>“Найти по названию”</b>.
        </div>
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

<input
  placeholder="Ссылка на картинку (URL)"
  value={newImageUrl}
  onChange={(e) => setNewImageUrl(e.target.value)}
  style={{ marginRight: 8, width: 260 }}
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

<input
  placeholder="Ссылка на картинку (URL)"
  value={editImageUrl}
  onChange={(e) => setEditImageUrl(e.target.value)}
  style={{ marginRight: 8, width: 260 }}
/>

<button onClick={saveEdit} style={{ marginRight: 4 }}>
  Сохранить
</button>
<button onClick={cancelEdit}>Отмена</button>
                </div>
              ) : (
                <div>
                  <Link
  to={`/hotels/${h.id}`}
  style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none" }}
>
  {h.images?.[0] ? (
    <img
      src={h.images[0]}
      alt={h.title}
      style={{ width: 90, height: 65, objectFit: "cover", borderRadius: 10 }}
    />
  ) : (
    <div style={{ width: 90, height: 65, borderRadius: 10, background: "#eee" }} />
  )}

  <div>
    <div style={{ fontWeight: 600, color: "#111" }}>{h.title}</div>
    <div style={{ color: "gray" }}>{h.location}</div>
  </div>
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
