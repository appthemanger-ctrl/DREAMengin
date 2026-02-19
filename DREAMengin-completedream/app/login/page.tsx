"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";

import PasswordField from "@/components/auth/PasswordField";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedRemember = window.localStorage.getItem("rememberMe");
    const shouldRemember = storedRemember !== "false";
    setRememberMe(shouldRemember);
    if (shouldRemember) {
      const storedEmail = window.localStorage.getItem("rememberedEmail") || "";
      setEmail(storedEmail);
    }
  }, []);

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
      window.localStorage.setItem("rememberMe", String(rememberMe));
      if (rememberMe) {
        window.localStorage.setItem("rememberedEmail", email.trim());
      } else {
        window.localStorage.removeItem("rememberedEmail");
      }
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
      {/* Dr. Eams Hero Message */}
      <div className="absolute top-8 left-0 right-0 flex justify-center px-4 z-10">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-1 shadow-2xl max-w-2xl w-full">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-[22px] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-9 h-9 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-4 border-slate-900 animate-pulse" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  Hello! I'm Dr. Eams
                  <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                </h2>
                <p className="text-base sm:text-lg text-purple-200 mt-1">
                  You can ask me anything!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-xl p-6 mt-32">
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

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            inputClassName="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-14 outline-none focus:ring-2 focus:ring-purple-500"
            className="space-y-2"
          />

          <label className="flex items-center gap-3 text-sm text-white/80 min-h-[44px]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30"
            />
            <span>Remember me</span>
          </label>

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
