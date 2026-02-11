"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

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
    <main className="relative min-h-screen px-4 py-10">
      {/* video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover -z-10 opacity-70"
      >
        <source src="/videos/signup-bg.mov" type="video/quicktime" />
        <source src="/videos/signup-bg.mp4" type="video/mp4" />
      </video>

      {/* brand glow overlay (red ↔ blue) */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/5 via-black/20 to-black/40" />
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/5 via-black/15 to-black/25" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo-icon.jpeg"
            alt="DreamEngin"
            width={44}
            height={44}
            className="rounded-xl border border-white/10 bg-white/5"
            priority
          />
          <div className="leading-tight">
            <p className="text-sm font-medium text-white/80">DreamEngin</p>
            <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-white/10 bg-black/5 p-6 shadow-2xl backdrop-blur-sm">
          <p className="mb-6 text-sm text-white/70">
            Register with email/password, or use an OAuth provider.
          </p>

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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-sky-400/50"
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-sky-400/50"
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-sky-400/50"
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
                I agree to the{" "}
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
                I agree to the{" "}
                <a className="underline hover:text-white" href="/terms">
                  Terms and conditions
                </a>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-red-500/90 via-fuchsia-500/80 to-sky-400/90 px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {busy ? "Creating…" : "Register"}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => oauth("google")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 disabled:opacity-60"
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => oauth("github")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10 disabled:opacity-60"
            >
              Continue with GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-white/70">
            Already have an account?{" "}
            <Link className="text-sky-300 hover:text-sky-200" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
