import "./BookingsPage.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings, deleteBooking } from "../api/bookings";

type Booking = {
  id: number;
  room_id?: number;
  pet_id?: number | null;
  user_id?: number;
  price?: number;
  hotel_title?: string;
  pet_name?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
};

export default function BookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const getBookingStatus = (booking: Booking) => {
  if (!booking.date_from || !booking.date_to) return "Не указано";

  const today = new Date();
  const dateFrom = new Date(booking.date_from);
  const dateTo = new Date(booking.date_to);

  if (today < dateFrom) return "Запланировано";
  if (today >= dateFrom && today <= dateTo) return "Активно";
  return "Завершено";
};

  const loadBookings = async () => {
    setMessage(null);
    try {
      const data = await getMyBookings();
      setBookings(data);

      if (!data.length) {
        setMessage("У вас пока нет бронирований.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Ошибка при загрузке бронирований.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Удалить бронирование?")) return;

    try {
      await deleteBooking(id);
      await loadBookings();
      alert("Бронирование успешно удалено");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Ошибка при удалении бронирования");
    }
  };

  return (
    <div className="bookings-page">
      <div className="bookings-page__container">
        <section className="bookings-card bookings-hero">
          <div className="bookings-hero__top">
            <div>
              <h1 className="bookings-hero__title">Мои бронирования</h1>
              <p className="bookings-hero__subtitle">
                Управляйте активными и завершёнными бронированиями
              </p>
            </div>

            <div className="bookings-actions">
              <button
                type="button"
                className="bookings-btn bookings-btn--secondary"
                onClick={() => navigate("/pets")}
              >
                Мои питомцы
              </button>

              <button
                type="button"
                className="bookings-btn bookings-btn--primary"
                onClick={() => navigate("/hotels")}
              >
                К отелям
              </button>
            </div>
          </div>
        </section>

        {message && <div className="bookings-message">{message}</div>}

        {bookings.length > 0 && (
          <section className="bookings-list">
            {bookings.map((booking) => (
              <article key={booking.id} className="bookings-item">
                <div className="bookings-item__top">
                  <div>
                    <h3 className="bookings-item__title">
                      {booking.hotel_title || `Бронирование #${booking.id}`}
                    </h3>
                    <p className="bookings-item__subtitle">
                      Питомец: {booking.pet_name || (booking.pet_id ? `ID ${booking.pet_id}` : "Не указано")}
                    </p>
                  </div>

                  <div className="bookings-actions">
                    <button
                      type="button"
                      className="bookings-btn bookings-btn--danger"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="bookings-grid">
                  <div className="bookings-box">
                    <div className="bookings-box__label">Комната</div>
                    <div className="bookings-box__value">
                      {booking.room_id ?? "Не указано"}
                    </div>
                  </div>

                  <div className="bookings-box">
                    <div className="bookings-box__label">Статус</div>
                    <div className="bookings-box__value">
                      {booking.status || getBookingStatus(booking)}
                    </div>
                  </div>

                  <div className="bookings-box">
                    <div className="bookings-box__label">Дата заезда</div>
                    <div className="bookings-box__value">
                      {booking.date_from || "Не указано"}
                    </div>
                  </div>

                  <div className="bookings-box">
                    <div className="bookings-box__label">Дата выезда</div>
                    <div className="bookings-box__value">
                      {booking.date_to || "Не указано"}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}