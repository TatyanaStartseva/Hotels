// src/pages/LoginPage.tsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { AuthContext } from "../contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();

  const { refreshAuth } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password });
      }

      // обновляем контекст, чтобы isAdmin / isLogged стали актуальными
      await refreshAuth();

      // и только потом переходим на главную
      navigate("/");
    } catch (e: any) {
      alert("Ошибка авторизации");
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <button type="submit" style={{ marginRight: 10 }}>
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>

        <button
          type="button"
          onClick={() =>
            setMode(prev => (prev === "login" ? "register" : "login"))
          }
        >
          {mode === "login" ? "Перейти к регистрации" : "Перейти ко входу"}
        </button>
      </form>
    </div>
  );
}
