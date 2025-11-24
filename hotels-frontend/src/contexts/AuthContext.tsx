// src/contexts/AuthContext.tsx
import { createContext } from "react";

export interface AuthContextValue {
  isAdmin: boolean;
  isLogged: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  isLogged: false,
  refreshAuth: async () => {},
});
