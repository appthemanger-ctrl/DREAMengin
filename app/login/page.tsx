"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PasswordField from "@/components/auth/PasswordField";
import { createClient } from "@/lib/supabase/client";

// Shared input style — matches the rest of the de-widget design system
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  background: "var(--de-mist)",
  border: "1px solid var(--de-border)",
  color: "var(--de-text)",
  fontSize: 14,
  outline: "none",
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError]         = useState<string | null>(null);

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
      setError((err as { message?: string })?.message ?? "Login failed");
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
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "OAuth failed");
      setBusy(false);
    }
  };

  return (
    <div className="de-sky-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">

      {/* Dr. Eams welcome banner */}
      <div className="de-widget w-full max-w-md mb-5" style={{ borderColor: "rgba(42,138,184,0.3)" }}>
        <div className="de-widget-body flex items-center gap-4 py-4">
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(42,138,184,0.18) 0%, rgba(200,152,26,0.14) 100%)",
            border: "1.5px solid rgba(42,138,184,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>∞</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--de-heading)", lineHeight: 1.2 }}>
              Welcome back
            </div>
            <div style={{ fontSize: 13, color: "var(--de-text-dim)", marginTop: 2 }}>
              I'm Dr. Eams — ask me anything once you're in.
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="de-widget w-full max-w-md">
        <div className="de-widget-header">
          <span className="de-widget-title">Sign In</span>
        </div>

        <div className="de-widget-body" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <form onSubmit={signIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--de-text-dim)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Email
              </span>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                style={INPUT_STYLE}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
              <Link href="/auth/reset-password" style={{ fontSize: 12, color: 'var(--de-accent)', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--de-text)", minHeight: 44, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--de-accent)" }}
              />
              Remember me
            </label>

            {error && (
              <div className="de-notice" style={{
                background: "rgba(220,68,68,0.08)",
                borderColor: "rgba(220,68,68,0.25)",
                color: "#dc4444",
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="de-btn de-btn-primary" style={{ width: "100%" }}>
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--de-border)" }} />
            <span style={{ fontSize: 11, color: "var(--de-text-dim)" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "var(--de-border)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" disabled={busy} onClick={() => oauth("google")} className="de-btn de-btn-ghost" style={{ width: "100%" }}>
              Continue with Google
            </button>
            <button type="button" disabled={busy} onClick={() => oauth("github")} className="de-btn de-btn-ghost" style={{ width: "100%" }}>
              Continue with GitHub
            </button>
          </div>
        </div>

        <div className="de-widget-actions" style={{ justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "var(--de-text-dim)" }}>
            New here?{" "}
            <Link href="/join" style={{ color: "var(--de-accent)", fontWeight: 700 }}>
              Create an account
            </Link>
          </span>
        </div>
      </div>

    </div>
  );
}
