"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/components/auth/PasswordField";

// Shared input style — matches the de-widget design system
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

export default function JoinPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [password2, setPassword2]     = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms]   = useState(false);
  const [rememberMe, setRememberMe]   = useState(true);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [notice, setNotice]           = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    const storedRemember = window.localStorage.getItem("rememberMe");
    const shouldRemember = storedRemember !== "false";
    setRememberMe(shouldRemember);
    if (shouldRemember) {
      const storedEmail = window.localStorage.getItem("rememberedEmail") || "";
      setEmail(storedEmail);
    }
  }, []);

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

      window.localStorage.setItem("rememberMe", String(rememberMe));
      if (rememberMe) {
        window.localStorage.setItem("rememberedEmail", email.trim());
      } else {
        window.localStorage.removeItem("rememberedEmail");
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
    <div className="de-sky-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">

      {/* Header wordmark */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <span className="de-wordmark" style={{ fontSize: 36 }}>dreamengin</span>
        <div style={{ fontSize: 13, color: "var(--de-text-dim)", marginTop: 6, letterSpacing: "0.04em" }}>Create your account — it&apos;s free</div>
      </div>

      <div className="de-widget w-full max-w-md" style={{ background: "rgba(255,255,255,0.93)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        <div className="de-widget-header">
          <span className="de-widget-title">Register</span>
        </div>

        <div className="de-widget-body" style={{ paddingTop: 18, paddingBottom: 18 }}>
          {error && (
            <div className="de-notice" style={{ marginBottom: 14, background: "rgba(220,68,68,0.08)", borderColor: "rgba(220,68,68,0.25)", color: "#dc4444" }}>
              {error}
            </div>
          )}
          {notice && (
            <div className="de-notice" style={{ marginBottom: 14, background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.25)", color: "#16a34a" }}>
              {notice}
            </div>
          )}

          <form onSubmit={signup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--de-text-dim)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={INPUT_STYLE}
                placeholder="you@dreamengin.com"
              />
            </label>

            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="••••••••"
            />

            <PasswordField
              label="Retype password"
              value={password2}
              onChange={setPassword2}
              autoComplete="new-password"
              placeholder="••••••••"
            />

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--de-text)", minHeight: 44, cursor: "pointer" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--de-accent)" }} />
              Remember me
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--de-text)", cursor: "pointer" }}>
              <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--de-accent)", flexShrink: 0 }} />
              <span>I agree to the <a href="/policy" style={{ color: "var(--de-accent)", textDecoration: "underline" }}>Privacy Policy</a>.</span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--de-text)", cursor: "pointer" }}>
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--de-gold)", flexShrink: 0 }} />
              <span>I agree to the <a href="/policy" style={{ color: "var(--de-gold)", textDecoration: "underline" }}>Terms &amp; Conditions</a>.</span>
            </label>

            <button type="submit" disabled={busy} className="de-btn de-btn-gold" style={{ width: "100%" }}>
              {busy ? "Creating…" : "Create Account"}
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
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--de-accent)", fontWeight: 700 }}>Sign in</Link>
          </span>
        </div>
      </div>

    </div>
  );
}
