"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!agreePrivacy || !agreeTerms) {
      setError("Please accept Privacy Policy and Terms.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // If email confirmation is enabled, Supabase will send a confirmation link.
          // Keep callback working for OAuth + confirmations.
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If email confirmations are ON, session may be null until confirmed.
      if (!data.session) {
        setNotice("Check your email to confirm your account, then sign in.");
        return;
      }

      router.replace("/home");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "github") {
    setError(null);
    setBusy(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });
      if (oauthError) setError(oauthError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Register a new account</h1>
          <p className="mt-1 text-sm text-white/70">Create a password-based account (no magic links).</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        ) : null}

        <form onSubmit={signup} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-purple-400/50"
              placeholder="you@dreamengin.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-purple-400/50"
              placeholder="••••••••"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Retype password</span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-purple-400/50"
              placeholder="••••••••"
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
            />
            <span>
              I have read and agree to the{" "}
              <a className="underline hover:text-white" href="/privacy">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
            />
            <span>
              I have read and agree to the{" "}
              <a className="underline hover:text-white" href="/terms">
                Terms and conditions
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
          >
            {busy ? "Creating…" : "Register"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth("google")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            Sign up with Google
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth("github")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            Register with GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link className="text-purple-300 hover:text-purple-200" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
