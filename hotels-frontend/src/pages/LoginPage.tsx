import "./LoginPage.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setMessage(null);
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Введите email и пароль");
      return;
    }

    try {
      await loginUser({
        email: email.trim(),
        password,
      });

      setMessage("Вход выполнен успешно");
      navigate("/hotels");
    } catch (e) {
      console.error(e);
      setError("Ошибка входа. Проверьте email и пароль.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Вход</h1>
        <p className="login-subtitle">
          Войдите в аккаунт, чтобы управлять отелями, питомцами и бронированиями
        </p>

        {message && <div className="login-message">{message}</div>}
        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label className="login-label">Email</label>
          <input
            className="login-input"
            type="email"
            placeholder="Введите email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="login-field">
          <label className="login-label">Пароль</label>
          <input
            className="login-input"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
          />
        </div>

        <div className="login-actions">
          <button
            type="button"
            className="login-btn login-btn--primary"
            onClick={handleLogin}
          >
            Войти
          </button>

          <button
            type="button"
            className="login-btn login-btn--secondary"
            onClick={() => navigate("/hotels")}
          >
            К отелям
          </button>
        </div>
      </div>
    </div>
  );
}