import { useEffect, useState } from "react";

type User = { id: string; username: string; role: "user" | "admin" };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function refresh() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setUser(data.user || null);
      setAdminUnlocked(!!data.adminUnlocked);
    } catch {
      setUser(null);
      setAdminUnlocked(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      setAdminUnlocked(false);
      setIsLoggingOut(false);
      window.location.href = "/"; // back to landing
    }
  }

  return {
    user,
    adminUnlocked,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut,
    refresh,
  };
}
