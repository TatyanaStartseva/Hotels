import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        setIsAdmin(res.data.is_admin);
      } catch {
        setIsAdmin(false);
      }
    };
    load();
  }, []);

  if (isAdmin === null) return <div>Загрузка...</div>;

  if (!isAdmin) return <Navigate to="/" />;

  return children;
}