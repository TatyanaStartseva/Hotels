import { useNavigate } from "react-router-dom";
import "./PlansPage.css";

const plans = [
  {
    id: "basic",
    title: "Basic",
    price: "499 ₽ / мес",
    description: "Базовый тариф для размещения и просмотра объявлений.",
    features: [
      "Стандартный доступ",
      "Просмотр всех отелей",
      "Обычное размещение рекламы",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    price: "999 ₽ / мес",
    description: "Расширенный тариф с повышенным приоритетом.",
    features: [
      "Все возможности Basic",
      "Приоритетное размещение",
      "Реклама показывается чаще",
    ],
  },
  {
    id: "premium",
    title: "Premium",
    price: "1499 ₽ / мес",
    description: "Максимальный тариф для лучшего продвижения.",
    features: [
      "Все возможности Pro",
      "Максимальный приоритет",
      "Увеличенная частота показа рекламы",
      "Будущая аналитика кликов",
    ],
  },
];

export default function PlansPage() {
  const navigate = useNavigate();

  const handleBuy = (planId: string) => {
    alert(`Вы выбрали тариф: ${planId}. Позже сюда можно подключить реальную оплату.`);
  };

  return (
    <div className="plans-page">
      <div className="plans-page__container">
        <div className="plans-page__header">
          <h1 className="plans-page__title">Тарифные планы</h1>
          <p className="plans-page__subtitle">
            Выберите подходящую подписку для продвижения и дополнительных возможностей
          </p>

          <button
            type="button"
            className="plans-page__back"
            onClick={() => navigate("/")}
          >
            ← Назад
          </button>
        </div>

        <div className="plans-page__grid">
          {plans.map((plan) => (
            <div className="plan-card" key={plan.id}>
              <h2 className="plan-card__title">{plan.title}</h2>
              <div className="plan-card__price">{plan.price}</div>
              <p className="plan-card__description">{plan.description}</p>

              <ul className="plan-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                type="button"
                className="plan-card__button"
                onClick={() => handleBuy(plan.id)}
              >
                Выбрать тариф
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}