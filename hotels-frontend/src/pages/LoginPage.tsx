import "./LoginPage.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError("Введите email и пароль");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    resetMessages();

    if (!validateForm()) return;

    try {
      await loginUser({
        email: email.trim(),
        password,
      });

      setMessage("Вход выполнен успешно");
      navigate("/hotels");
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail ?? "Ошибка входа. Проверьте email и пароль.");
    }
  };

  const handleRegister = async () => {
    resetMessages();

    if (!validateForm()) return;

    try {
      await registerUser({
        email: email.trim(),
        password,
      });

      setMessage("Регистрация прошла успешно. Теперь войдите в аккаунт.");
      setIsRegisterMode(false);
      setPassword("");
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail ?? "Ошибка регистрации");
    }
  };

  const handleSubmit = async () => {
    if (isRegisterMode) {
      await handleRegister();
    } else {
      await handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">
          {isRegisterMode ? "Регистрация" : "Вход"}
        </h1>

        <p className="login-subtitle">
          {isRegisterMode
            ? "Создайте аккаунт, чтобы бронировать отели, управлять питомцами и оставлять отзывы"
            : "Войдите в аккаунт, чтобы управлять отелями, питомцами и бронированиями"}
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
                handleSubmit();
              }
            }}
          />
        </div>

        <div className="login-actions">
          <button
            type="button"
            className="login-btn login-btn--primary"
            onClick={handleSubmit}
          >
            {isRegisterMode ? "Зарегистрироваться" : "Войти"}
          </button>

          <button
            type="button"
            className="login-btn login-btn--accent"
            onClick={() => {
              resetMessages();
              setIsRegisterMode((prev) => !prev);
            }}
          >
            {isRegisterMode ? "Уже есть аккаунт? Войти" : "Перейти к регистрации"}
          </button>

          <button
  type="button"
  className="login-btn login-btn--primary"
  onClick={() => navigate("/hotels")}
>
  К отелям
</button>
        </div>
      </div>
    </div>
  );
}