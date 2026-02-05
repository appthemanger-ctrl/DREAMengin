"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      router.replace("/home");
      router.refresh();
    } catch (err: unknown) {
      setError(err?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "github") => {
    setError(null);
    setBusy(true);
    try {
      const origin = window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError(err?.message ?? "OAuth failed");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="text-sm text-white/70 mt-1">Use email + password or continue with a provider.</p>
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/80" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 font-medium disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/50">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth("google")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth("github")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            Continue with GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/70">
          New here?{" "}
          <Link className="text-purple-300 hover:text-purple-200" href="/join">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
