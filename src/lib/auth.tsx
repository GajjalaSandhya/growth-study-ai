import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/services/api";
import type { User } from "@/services/types";

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate active session against real backend GET /api/auth/me on mount
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        setUser(currentUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      } catch (err) {
        console.warn("Session validation failed. Clearing credentials.", err);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const persist = useCallback((next: User) => {
    setUser(next);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      loading,
      signIn: persist,
      signOut: () => {
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setUser(null);
      },
      updateUser: (patch) => {
        if (user) {
          persist({ ...user, ...patch });
        }
      },
    }),
    [user, loading, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
