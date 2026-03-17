import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types/auth";
import { getMe, logout as apiLogout } from "../services/authservice";

// TODO: might need to add more stuff here later

interface AuthContextType {
  user: User | null;
  logout: () => void;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // check if user is already logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      getMe()
        .then((res) => {
          if (res.success) setUser(res.data);
        })
        .catch(() => {
          // token probably expired
          localStorage.removeItem("accessToken");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logoutUser = async () => {
    await apiLogout();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, logout: logoutUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// custom hook to use auth anywhere
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
