import "./HotelsPage.css";
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
import AdBanner from "../components/AdBanner";

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

function getSpeciesLabel(species?: string) {
  switch (species) {
    case "cat":
      return "Кошка";
    case "dog":
      return "Собака";
    case "rabbit":
      return "Кролик";
    case "rodent":
      return "Грызун";
    case "bird":
      return "Птица";
    case "snake":
      return "Змея";
    case "reptile":
      return "Рептилия";
    case "spider":
      return "Паук";
    default:
      return "Питомец";
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
  const [isHotelOwner, setIsHotelOwner] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | "">("");

  const [species, setSpecies] = useState<string>("");
  const [conditionsKey, setConditionsKey] = useState<string>("");

  const [tMin, setTMin] = useState<number | "">("");
  const [tMax, setTMax] = useState<number | "">("");
  const [hMin, setHMin] = useState<number | "">("");
  const [hMax, setHMax] = useState<number | "">("");

  const [vaccinationsText, setVaccinationsText] = useState("");
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
      setIsHotelOwner(me.is_hotel_owner === true);
      console.log("ME:", me);
    } catch (e) {
      console.log("Не залогинен или ошибка /auth/me", e);
      setIsLogged(false);
      setIsAdmin(false);
      setIsHotelOwner(false);
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

  useEffect(() => {
    if (!selectedPetId) return;

    const pet = pets.find((p) => p.id === selectedPetId);
    if (!pet) return;

    setSpecies((pet as any).species ?? "");

    setTMin(pet.temperature_min ?? "");
    setTMax(pet.temperature_max ?? "");
    setHMin(pet.humidity_min ?? "");
    setHMax(pet.humidity_max ?? "");

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
      const titleValue = (h as any).title ?? (h as any).name ?? `Отель #${h.id}`;
      const locationValue = (h as any).location ?? "";

      if (!map.has(h.id)) {
        map.set(
          h.id,
          {
            id: h.id,
            title: titleValue,
            location: locationValue,
          } as Hotel
        );
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
      (hotel as any).images && (hotel as any).images.length
        ? (hotel as any).images[0]
        : "";

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
    <div className="hotels-page">
      <div className="hotels-page__layout">
        <aside className="hotels-page__sidebar">
          <div className="hotels-page__sidebar-sticky">
            <AdBanner />
            <AdBanner />
          </div>
        </aside>

        <main className="hotels-page__content">
          <section className="hotels-card hotels-hero">
            <div className="hotels-hero__top">
              <div>
                <h1 className="hotels-hero__title">Отели</h1>
                <p className="hotels-hero__subtitle">
                  Поиск, фильтрация и управление отелями для питомцев
                </p>
              </div>

              <div className="hotels-hero__actions">
                <button
                  type="button"
                  className="hotels-btn hotels-btn--ghost"
                  onClick={() => navigate("/login")}
                >
                  {isLogged ? "Профиль / вход" : "Войти"}
                </button>

                <button
                  type="button"
                  className="hotels-btn hotels-btn--secondary"
                  onClick={() => navigate("/pets")}
                >
                  Мои питомцы
                </button>

                <button
                  type="button"
                  className="hotels-btn hotels-btn--primary"
                  onClick={() => navigate("/bookings")}
                >
                  Мои бронирования
                </button>

                <button
                  type="button"
                  className="hotels-btn hotels-btn--secondary"
                  onClick={() => navigate("/plans")}
                >
                  Подписки
                </button>

                {(isHotelOwner || isAdmin) && (
                  <button
                    type="button"
                    className="hotels-btn hotels-btn--primary"
                    onClick={() => navigate("/owner/hotels")}
                  >
                    Мои отели
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="hotels-btn hotels-btn--primary"
                    onClick={() => navigate("/admin/ads")}
                  >
                    Управление рекламой
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="hotels-btn hotels-btn--secondary"
                    onClick={() => navigate("/admin/users")}
                  >
                    Пользователи
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="hotels-card">
            <h2 className="hotels-section-title">Поиск отелей</h2>

            <div className="hotels-search-grid">
              <div className="hotels-field">
                <label className="hotels-label">Город</label>
                <div className="hotels-inline-action">
                  <input
                    className="hotels-input"
                    placeholder="Город (Москва, Moscow, MOW...)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <button
                    type="button"
                    className="hotels-btn hotels-btn--primary"
                    onClick={searchByCity}
                  >
                    Найти по городу
                  </button>
                </div>
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Название отеля</label>
                <div className="hotels-inline-action">
                  <input
                    className="hotels-input"
                    placeholder="Название отеля"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <button
                    type="button"
                    className="hotels-btn hotels-btn--secondary"
                    onClick={searchByTitle}
                  >
                    Найти по названию
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="hotels-card">
            <div className="hotels-section-head">
              <h2 className="hotels-section-title">Фильтр по требованиям питомца</h2>
              <button
                type="button"
                className="hotels-btn hotels-btn--ghost"
                onClick={clearPetFilter}
              >
                Очистить фильтр
              </button>
            </div>

            <div className="hotels-filter-grid">
              <div className="hotels-field hotels-field--wide">
                <label className="hotels-label">Питомец</label>
                <select
                  className="hotels-select"
                  value={selectedPetId}
                  onChange={(e) =>
                    setSelectedPetId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">— не выбран (ввод вручную) —</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {getSpeciesLabel(p.species)}
                      {p.conditions ? ` (${p.conditions})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Вид животного</label>
                <select
                  className="hotels-select"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  {SPECIES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Условия</label>
                <select
                  className="hotels-select"
                  value={conditionsKey}
                  onChange={(e) => setConditionsKey(e.target.value)}
                >
                  {CONDITIONS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Темп. мин</label>
                <input
                  className="hotels-input"
                  placeholder="Темп. мин"
                  type="number"
                  value={tMin}
                  onChange={(e) => setTMin(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Темп. макс</label>
                <input
                  className="hotels-input"
                  placeholder="Темп. макс"
                  type="number"
                  value={tMax}
                  onChange={(e) => setTMax(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Влажн. мин</label>
                <input
                  className="hotels-input"
                  placeholder="Влажн. мин"
                  type="number"
                  value={hMin}
                  onChange={(e) => setHMin(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Влажн. макс</label>
                <input
                  className="hotels-input"
                  placeholder="Влажн. макс"
                  type="number"
                  value={hMax}
                  onChange={(e) => setHMax(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="hotels-field hotels-field--wide">
                <label className="hotels-label">Прививки (через запятую)</label>
                <input
                  className="hotels-input"
                  placeholder="Например: rabies, complex"
                  value={vaccinationsText}
                  onChange={(e) => setVaccinationsText(e.target.value)}
                />
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Диета (тип)</label>
                <input
                  className="hotels-input"
                  placeholder="Диета (тип)"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                />
              </div>

              <div className="hotels-field hotels-field--wide">
                <label className="hotels-label">Особенности питания</label>
                <input
                  className="hotels-input"
                  placeholder="Особенности питания"
                  value={dietDetails}
                  onChange={(e) => setDietDetails(e.target.value)}
                />
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Кормлений/день</label>
                <input
                  className="hotels-input"
                  placeholder="Кормлений/день"
                  type="number"
                  value={feedings}
                  onChange={(e) =>
                    setFeedings(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Лицензия</label>
                <select
                  className="hotels-select"
                  value={licenseRequired === "" ? "" : licenseRequired ? "true" : "false"}
                  onChange={(e) =>
                    setLicenseRequired(e.target.value === "" ? "" : e.target.value === "true")
                  }
                >
                  <option value="">—</option>
                  <option value="false">Не нужна</option>
                  <option value="true">Нужна</option>
                </select>
              </div>

              <div className="hotels-field">
                <label className="hotels-label">Совместно</label>
                <select
                  className="hotels-select"
                  value={cohabAllowed === "" ? "" : cohabAllowed ? "true" : "false"}
                  onChange={(e) =>
                    setCohabAllowed(e.target.value === "" ? "" : e.target.value === "true")
                  }
                >
                  <option value="">—</option>
                  <option value="true">Можно</option>
                  <option value="false">Нельзя</option>
                </select>
              </div>
            </div>

            <div className="hotels-note">
              Фильтр применяется при нажатии кнопок <b>«Найти по городу»</b> /{" "}
              <b>«Найти по названию»</b>.
            </div>
          </section>

          {message && <div className="hotels-message">{message}</div>}

          {isAdmin && (
            <section className="hotels-card">
              <h2 className="hotels-section-title">
                Добавить отель (только администратор)
              </h2>

              <div className="hotels-admin-grid">
                <div className="hotels-field">
                  <label className="hotels-label">Название</label>
                  <input
                    className="hotels-input"
                    placeholder="Название"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="hotels-field">
                  <label className="hotels-label">Город</label>
                  <input
                    className="hotels-input"
                    placeholder="Город"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>

                <div className="hotels-field hotels-field--wide">
                  <label className="hotels-label">Ссылка на картинку (URL)</label>
                  <input
                    className="hotels-input"
                    placeholder="Ссылка на картинку (URL)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="hotels-actions-row">
                <button
                  type="button"
                  className="hotels-btn hotels-btn--primary"
                  onClick={handleCreateHotel}
                >
                  Добавить
                </button>
              </div>
            </section>
          )}

          {hotels.length > 0 && (
            <section className="hotels-list">
              {hotels.map((h) => (
                <article key={h.id} className="hotels-item-card">
                  {editingId === h.id ? (
                    <div className="hotels-edit-grid">
                      <div className="hotels-field">
                        <label className="hotels-label">Название</label>
                        <input
                          className="hotels-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>

                      <div className="hotels-field">
                        <label className="hotels-label">Город</label>
                        <input
                          className="hotels-input"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                        />
                      </div>

                      <div className="hotels-field hotels-field--wide">
                        <label className="hotels-label">Ссылка на картинку (URL)</label>
                        <input
                          className="hotels-input"
                          placeholder="Ссылка на картинку (URL)"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                        />
                      </div>

                      <div className="hotels-actions-row">
                        <button
                          type="button"
                          className="hotels-btn hotels-btn--primary"
                          onClick={saveEdit}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="hotels-btn hotels-btn--ghost"
                          onClick={cancelEdit}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="hotels-item-card__content">
                      <Link to={`/hotels/${h.id}`} className="hotels-item-card__link">
                        {h.images?.[0] ? (
                          <img
                            src={h.images[0]}
                            alt={h.title}
                            className="hotels-item-card__image"
                          />
                        ) : (
                          <div className="hotels-item-card__image hotels-item-card__image--empty" />
                        )}

                        <div className="hotels-item-card__info">
                          <div className="hotels-item-card__title">
                            {h.title_ru?.trim() ? h.title_ru : h.title}
                          </div>
                          <div className="hotels-item-card__location">
                            {h.location_ru?.trim() ? h.location_ru : h.location}
                          </div>
                        </div>
                      </Link>

                      {isAdmin && (
                        <div className="hotels-item-card__admin-actions">
                          <button
                            type="button"
                            className="hotels-btn hotels-btn--secondary"
                            onClick={() => startEdit(h)}
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            className="hotels-btn hotels-btn--danger"
                            onClick={() => handleDeleteHotel(h.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </section>
          )}
        </main>

        <aside className="hotels-page__sidebar">
          <div className="hotels-page__sidebar-sticky">
            <AdBanner />
            <AdBanner />
          </div>
        </aside>
      </div>
    </div>
  );
}