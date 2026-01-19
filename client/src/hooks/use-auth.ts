import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthedUser = {
  id: string;
  username: string;
};

type AuthContextValue = {
  user: AuthedUser | null;
  isLoading: boolean;
  login: (args: { username: string; password: string }) => Promise<void>;
  signup: (args: { username: string; password: string }) => Promise<void>;
  adminLogin: (args: { key: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || res.statusText);
  }
  return (await res.json()) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      const me = await apiJson<{ user: AuthedUser | null }>("/api/auth/me");
      setUser(me.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async ({ username, password }) => {
        await apiJson("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        await refresh();
      },
      signup: async ({ username, password }) => {
        await apiJson("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        await refresh();
      },
      adminLogin: async ({ key }) => {
        await apiJson("/api/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        await refresh();
      },
      logout: async () => {
        await apiJson("/api/auth/logout", { method: "POST" });
        setUser(null);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
