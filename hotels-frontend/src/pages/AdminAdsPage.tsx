import { useEffect, useState } from "react";
import {
  createAd,
  deleteAd,
  getAdsAdmin,
  updateAd,
  type AdOut,
} from "../api/ads";
import "./AdminAdsPage.css";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAdId, setEditingAdId] = useState<number | null>(null);

  const emptyForm = {
    title: "",
    description: "",
    image_url: "",
    target_url: "",
    is_active: true,
    plan_name: "basic",
  };

  const [form, setForm] = useState(emptyForm);

  const loadAds = async () => {
    try {
      setLoading(true);
      const data = await getAdsAdmin();
      setAds(data);
    } catch (e) {
      console.error("Ошибка загрузки рекламы", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingAdId(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert("Введите название рекламы");
      return;
    }

    try {
      if (editingAdId !== null) {
        await updateAd(editingAdId, form);
      } else {
        await createAd(form);
      }

      resetForm();
      await loadAds();
    } catch (e) {
      console.error("Ошибка сохранения рекламы", e);
      alert("Не удалось сохранить рекламу");
    }
  };

  const handleEdit = (ad: AdOut) => {
    setEditingAdId(ad.id);
    setForm({
      title: ad.title || "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      target_url: ad.target_url || "",
      is_active: ad.is_active,
      plan_name: ad.plan_name || "basic",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm("Удалить рекламу?");
    if (!ok) return;

    try {
      await deleteAd(id);
      if (editingAdId === id) {
        resetForm();
      }
      await loadAds();
    } catch (e) {
      console.error("Ошибка удаления рекламы", e);
      alert("Не удалось удалить рекламу");
    }
  };

  return (
    <div className="admin-ads-page">
      <div className="admin-ads-container">
        <div className="admin-ads-header">
          <div>
            <h1 className="admin-ads-title">Управление рекламой</h1>
            <p className="admin-ads-subtitle">
              Добавляйте, редактируйте и удаляйте рекламные объявления
            </p>
          </div>
        </div>

        <section className="admin-ads-card admin-ads-form-card">
          <h2 className="admin-ads-section-title">
            {editingAdId !== null ? "Редактировать рекламу" : "Добавить рекламу"}
          </h2>

          <div className="admin-ads-form-grid">
            <div className="admin-ads-field">
              <label>Название</label>
              <input
                type="text"
                placeholder="Например: Скидка на премиум-уход"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />
            </div>

            <div className="admin-ads-field">
              <label>Тариф</label>
              <select
                value={form.plan_name}
                onChange={(e) =>
                  setForm({ ...form, plan_name: e.target.value })
                }
              >
                <option value="basic">basic</option>
                <option value="premium">premium</option>
                <option value="vip">vip</option>
              </select>
            </div>

            <div className="admin-ads-field admin-ads-field-full">
              <label>Описание</label>
              <textarea
                rows={4}
                placeholder="Краткое описание объявления"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="admin-ads-field">
              <label>Ссылка на изображение</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
              />
            </div>

            <div className="admin-ads-field">
              <label>Ссылка перехода</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.target_url}
                onChange={(e) =>
                  setForm({ ...form, target_url: e.target.value })
                }
              />
            </div>

            <div className="admin-ads-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <span>Реклама активна</span>
              </label>
            </div>
          </div>

          <div className="admin-ads-item-actions">
            <button className="admin-ads-primary-btn" onClick={handleSubmit}>
              {editingAdId !== null ? "Сохранить изменения" : "Добавить рекламу"}
            </button>

            {editingAdId !== null && (
              <button className="admin-ads-secondary-btn" onClick={resetForm}>
                Отмена
              </button>
            )}
          </div>
        </section>

        <section className="admin-ads-card">
          <div className="admin-ads-list-header">
            <h2 className="admin-ads-section-title">Все объявления</h2>
            <span className="admin-ads-count">Всего: {ads.length}</span>
          </div>

          {loading ? (
            <div className="admin-ads-empty">Загрузка...</div>
          ) : ads.length === 0 ? (
            <div className="admin-ads-empty">Рекламы пока нет</div>
          ) : (
            <div className="admin-ads-list">
              {ads.map((ad) => (
                <div className="admin-ads-item" key={ad.id}>
                  <div className="admin-ads-item-top">
                    <div>
                      <h3 className="admin-ads-item-title">{ad.title}</h3>
                      <p className="admin-ads-item-desc">
                        {ad.description || "Без описания"}
                      </p>
                    </div>

                    <span
                      className={
                        ad.is_active
                          ? "admin-ads-status active"
                          : "admin-ads-status inactive"
                      }
                    >
                      {ad.is_active ? "Активна" : "Выключена"}
                    </span>
                  </div>

                  <div className="admin-ads-meta">
                    <span>Тариф: {ad.plan_name}</span>
                    <span>Вес: {ad.weight}</span>
                    <span>ID: {ad.id}</span>
                  </div>

                  {ad.image_url && (
                    <div className="admin-ads-preview">
                      <img src={ad.image_url} alt={ad.title} />
                    </div>
                  )}

                  <div className="admin-ads-links">
                    <div>
                      <strong>Изображение:</strong>{" "}
                      {ad.image_url ? ad.image_url : "—"}
                    </div>
                    <div>
                      <strong>Переход:</strong>{" "}
                      {ad.target_url ? ad.target_url : "—"}
                    </div>
                  </div>

                  <div className="admin-ads-item-actions">
                    <button
                      className="admin-ads-secondary-btn"
                      onClick={() => handleEdit(ad)}
                    >
                      Редактировать
                    </button>

                    <button
                      className="admin-ads-danger-btn"
                      onClick={() => handleDelete(ad.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}