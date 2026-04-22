import { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  getAllUsers,
  grantHotelOwner,
  revokeHotelOwner,
  type AdminUser,
} from "../api/adminUsers";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
      alert("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGrant = async (userId: number) => {
    try {
      await grantHotelOwner(userId);
      await loadUsers();
      alert("Права владельца выданы");
    } catch (e) {
      console.error(e);
      alert("Ошибка при выдаче прав");
    }
  };

  const handleRevoke = async (userId: number) => {
    try {
      await revokeHotelOwner(userId);
      await loadUsers();
      alert("Права владельца отозваны");
    } catch (e) {
      console.error(e);
      alert("Ошибка при отзыве прав");
    }
  };

  return (
    <div className="hotels-page">
      <Header />
      <div className="hotels-page__layout">
        <main className="hotels-page__content">
          <section className="hotels-card">
            <h1 className="hotels-section-title">Управление пользователями</h1>

            {loading ? (
              <p className="hotels-note">Загрузка...</p>
            ) : users.length === 0 ? (
              <p className="hotels-note">Пользователи не найдены</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="hotels-card"
                    style={{
                      marginBottom: 0,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{user.email}</div>
                      <div className="hotels-note">
                        id={user.id} | admin: {user.is_admin ? "да" : "нет"} | owner:{" "}
                        {user.is_hotel_owner ? "да" : "нет"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!user.is_hotel_owner ? (
                        <button
                          type="button"
                          className="hotels-btn hotels-btn--primary"
                          onClick={() => handleGrant(user.id)}
                        >
                          Выдать доступ владельца
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="hotels-btn hotels-btn--neutral"
                          onClick={() => handleRevoke(user.id)}
                        >
                          Забрать доступ владельца
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}