import "./OwnerHotelsPage.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createOwnerHotel,
  getMyHotels,
  patchMyHotel,
  publishMyHotel,
  unpublishMyHotel,
  type Hotel,
} from "../api/hotels";
import { getMe } from "../api/auth";

export default function OwnerHotelsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isHotelOwner, setIsHotelOwner] = useState(false);

  const [hotels, setHotels] = useState<Hotel[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const me = await getMe();

      const admin = me.is_admin === true;
      const owner = me.is_hotel_owner === true;

      setIsAdmin(admin);
      setIsHotelOwner(owner);

      if (!admin && !owner) {
        setHotels([]);
        setMessage("У вас нет прав владельца отеля.");
        return;
      }

      await loadMyHotels();
    } catch (e) {
      console.error(e);
      setHotels([]);
      setMessage("Не удалось загрузить кабинет владельца.");
    } finally {
      setLoading(false);
    }
  };

  const loadMyHotels = async () => {
    try {
      const data = await getMyHotels();
      setHotels(data);

      if (!data.length) {
        setMessage("У вас пока нет добавленных отелей.");
      } else {
        setMessage(null);
      }
    } catch (e) {
      console.error(e);
      setHotels([]);
      setMessage("Ошибка при загрузке ваших отелей.");
    }
  };

  const handleCreateHotel = async () => {
    if (!newTitle.trim() || !newLocation.trim()) {
      alert("Заполните название и город");
      return;
    }

    try {
      const imageUrl = newImageUrl.trim();

      await createOwnerHotel({
        title: newTitle.trim(),
        location: newLocation.trim(),
        images: imageUrl ? [imageUrl] : [],
      });

      setNewTitle("");
      setNewLocation("");
      setNewImageUrl("");

      await loadMyHotels();
      alert("Отель создан как черновик.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при создании отеля");
    }
  };

  const startEdit = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setEditTitle(hotel.title ?? "");
    setEditLocation(hotel.location_ru || hotel.location || "");

    const firstImg = hotel.images?.length ? hotel.images[0] : "";
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

    if (!editTitle.trim() || !editLocation.trim()) {
      alert("Заполните название и город");
      return;
    }

    try {
      const imageUrl = editImageUrl.trim();

      await patchMyHotel(editingId, {
        title: editTitle.trim(),
        location: editLocation.trim(),
        images: imageUrl ? [imageUrl] : [],
      });

      await loadMyHotels();
      cancelEdit();
      alert("Отель обновлён.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при редактировании отеля");
    }
  };

  const handlePublish = async (hotelId: number) => {
    try {
      await publishMyHotel(hotelId);
      await loadMyHotels();
      alert("Отель опубликован.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при публикации отеля");
    }
  };

  const handleUnpublish = async (hotelId: number) => {
    try {
      await unpublishMyHotel(hotelId);
      await loadMyHotels();
      alert("Отель снят с публикации.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "Ошибка при снятии с публикации");
    }
  };

  const getStatusLabel = (status?: string) => {
    if (status === "published") return "Опубликован";
    if (status === "archived") return "Архивный";
    return "Черновик";
  };

  const getStatusClass = (status?: string) => {
    if (status === "published") {
      return "owner-hotels-status owner-hotels-status--published";
    }
    if (status === "archived") {
      return "owner-hotels-status owner-hotels-status--archived";
    }
    return "owner-hotels-status owner-hotels-status--draft";
  };

  if (loading) {
    return (
      <div className="owner-hotels-page">
        <div className="owner-hotels-page__container">
          <section className="owner-hotels-hero">
            <div className="owner-hotels-hero__top">
              <div>
                <h1 className="owner-hotels-hero__title">Мои отели</h1>
                <p className="owner-hotels-hero__subtitle">Загрузка...</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isHotelOwner) {
    return (
      <div className="owner-hotels-page">
        <div className="owner-hotels-page__container">
          <section className="owner-hotels-hero">
            <div className="owner-hotels-hero__top">
              <div>
                <h1 className="owner-hotels-hero__title">Мои отели</h1>
                <p className="owner-hotels-hero__subtitle">
                  {message || "Нет доступа."}
                </p>
              </div>

              <div className="owner-hotels-hero__actions">
                <button
                  type="button"
                  className="owner-hotels-btn owner-hotels-btn--primary"
                  onClick={() => navigate("/")}
                >
                  На главную
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-hotels-page">
      <div className="owner-hotels-page__container">
        <section className="owner-hotels-hero">
          <div className="owner-hotels-hero__top">
            <div>
              <h1 className="owner-hotels-hero__title">Мои отели</h1>
              <p className="owner-hotels-hero__subtitle">
                Создание, редактирование и публикация ваших отелей
              </p>
            </div>

            <div className="owner-hotels-hero__actions">
              <button
                type="button"
                className="owner-hotels-btn owner-hotels-btn--primary"
                onClick={() => navigate("/")}
              >
                К отелям
              </button>
            </div>
          </div>
        </section>

        <section className="owner-hotels-card">
          <h2 className="owner-hotels-section-title">Добавить новый отель</h2>

          <div className="owner-hotels-grid">
            <div className="owner-hotels-field">
              <label className="owner-hotels-label">Название отеля</label>
              <input
                className="owner-hotels-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Например: Pet Paradise"
              />
            </div>

            <div className="owner-hotels-field">
              <label className="owner-hotels-label">Город</label>
              <input
                className="owner-hotels-input"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Например: Москва"
              />
            </div>

            <div className="owner-hotels-field owner-hotels-field--wide">
              <label className="owner-hotels-label">Ссылка на изображение</label>
              <input
                className="owner-hotels-input"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="owner-hotels-actions">
            <button
              type="button"
              className="owner-hotels-btn owner-hotels-btn--primary"
              onClick={handleCreateHotel}
            >
              Создать отель
            </button>
          </div>
        </section>

        <section className="owner-hotels-card">
          <div className="owner-hotels-section-head">
            <h2 className="owner-hotels-section-title owner-hotels-section-title--compact">
              Список моих отелей
            </h2>
          </div>

          {message && hotels.length === 0 && (
            <p className="owner-hotels-note">{message}</p>
          )}

          {!message && hotels.length === 0 && (
            <div className="owner-hotels-empty">У вас пока нет отелей.</div>
          )}

          {hotels.length > 0 && (
            <div className="owner-hotels-list">
              {hotels.map((hotel) => {
                const isEditing = editingId === hotel.id;
                const firstImage = hotel.images?.length ? hotel.images[0] : "";

                return (
                  <article key={hotel.id} className="owner-hotels-item">
                    {!isEditing ? (
                      <>
                        <div className="owner-hotels-item__top">
                          <div className="owner-hotels-item__info">
                            <h3 className="owner-hotels-item__title">{hotel.title}</h3>
                            <p className="owner-hotels-item__meta">
                              Город: {hotel.location_ru || hotel.location}
                            </p>
                            <div className={getStatusClass(hotel.status)}>
                              {getStatusLabel(hotel.status)}
                            </div>
                          </div>

                          <div className="owner-hotels-item__actions">
                            <button
                              type="button"
                              className="owner-hotels-btn owner-hotels-btn--secondary"
                              onClick={() => startEdit(hotel)}
                            >
                              Редактировать
                            </button>

                            {hotel.status !== "published" ? (
                              <button
                                type="button"
                                className="owner-hotels-btn owner-hotels-btn--neutral"
                                onClick={() => handlePublish(hotel.id)}
                              >
                                Опубликовать
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="owner-hotels-btn owner-hotels-btn--neutral"
                                onClick={() => handleUnpublish(hotel.id)}
                              >
                                Снять с публикации
                              </button>
                            )}

                            <button
                              type="button"
                              className="owner-hotels-btn owner-hotels-btn--primary"
                              onClick={() => navigate(`/hotels/${hotel.id}`)}
                            >
                              Добавить комнаты
                            </button>
                          </div>
                        </div>

                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={hotel.title}
                            className="owner-hotels-item__image"
                          />
                        ) : (
                          <div className="owner-hotels-item__image--empty">
                            Изображение не добавлено
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="owner-hotels-edit">
                        <h3 className="owner-hotels-item__title owner-hotels-item__title--edit">
                          Редактирование отеля
                        </h3>

                        <div className="owner-hotels-grid">
                          <div className="owner-hotels-field">
                            <label className="owner-hotels-label">Название</label>
                            <input
                              className="owner-hotels-input"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Название отеля"
                            />
                          </div>

                          <div className="owner-hotels-field">
                            <label className="owner-hotels-label">Город</label>
                            <input
                              className="owner-hotels-input"
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              placeholder="Город"
                            />
                          </div>

                          <div className="owner-hotels-field owner-hotels-field--wide">
                            <label className="owner-hotels-label">Ссылка на изображение</label>
                            <input
                              className="owner-hotels-input"
                              value={editImageUrl}
                              onChange={(e) => setEditImageUrl(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                        </div>

                        <div className="owner-hotels-actions">
                          <button
                            type="button"
                            className="owner-hotels-btn owner-hotels-btn--primary"
                            onClick={saveEdit}
                          >
                            Сохранить
                          </button>

                          <button
                            type="button"
                            className="owner-hotels-btn owner-hotels-btn--ghost"
                            onClick={cancelEdit}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}