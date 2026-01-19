import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "user";
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const data = await res.json();
      setState({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithKey = useCallback(async (key: string) => {
    const res = await fetch("/api/auth/admin-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Login failed");
    }
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    loginWithKey,
    logout,
    isLoggingOut: false,
  };
}
