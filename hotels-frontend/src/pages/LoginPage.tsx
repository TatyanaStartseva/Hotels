// hotels-frontend/src/pages/LoginPage.tsx
import { FormEvent, useState } from "react";
import { login, register } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password });
        await login({ email, password });
      }
      // 👉 после успешного логина идём на главную, а не сразу в брони
      navigate("/");
    } catch {
      alert("Ошибка авторизации");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <input
            type="password"
            placeholder="пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" style={{ marginTop: 10 }}>
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      <button
        style={{ marginTop: 10 }}
        type="button"
        onClick={() =>
          setMode(mode === "login" ? "register" : "login")
        }
      >
        {mode === "login" ? "Перейти к регистрации" : "Перейти к входу"}
      </button>
    </div>
  );
}
