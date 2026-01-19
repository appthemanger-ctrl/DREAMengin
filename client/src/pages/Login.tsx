import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function Login() {
  const { login, signup, adminLogin } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login({ username, password });
      else await signup({ username, password });
      window.location.href = "/app";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAdmin() {
    setError(null);
    setBusy(true);
    try {
      await adminLogin({ key: adminKey });
      window.location.href = "/app";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Admin login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{mode === "login" ? "Login" : "Create account"}</h1>
          <Link href="/" className="text-sm text-slate-300 underline">Home</Link>
        </div>

        <div className="flex gap-2">
          <button
            className={"flex-1 rounded-xl px-3 py-2 border " + (mode==="login" ? "bg-slate-800 border-slate-700" : "border-slate-700")}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={"flex-1 rounded-xl px-3 py-2 border " + (mode==="signup" ? "bg-slate-800 border-slate-700" : "border-slate-700")}
            onClick={() => setMode("signup")}
          >
            Create
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-slate-300">Username</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
          />
          <label className="block text-sm text-slate-300">Password</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full rounded-xl px-4 py-3 bg-cyan-500 text-slate-950 font-semibold disabled:opacity-60"
            disabled={busy || !username || !password}
            onClick={onSubmit}
          >
            {busy ? "..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="text-sm text-slate-300">Owner/Admin</div>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Master key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button
            className="w-full rounded-xl px-4 py-3 border border-slate-700 text-slate-100 disabled:opacity-60"
            disabled={busy || !adminKey}
            onClick={onAdmin}
          >
            Open Admin Panel
          </button>
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>
    </div>
  );
}
