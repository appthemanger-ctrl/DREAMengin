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

const DISABLED_BUTTON_OPACITY = 0.45;

export default function JoinPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [password2, setPassword2]     = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms]   = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [notice, setNotice]           = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<{ google: boolean | null; github: boolean | null } | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => {
        if (!r.ok) throw new Error("Unable to load OAuth provider status");
        return r.json();
      })
      .then((data) => setOauthProviders(data))
      .catch(() => setOauthProviders(null));
  }, []);

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
        const msg = signUpError.message;
        setError(
          msg === 'Failed to fetch' || msg.toLowerCase().includes('fetch')
            ? 'Unable to connect. Please check your internet connection and try again.'
            : msg
        );
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

      // New users go through onboarding before HomeDream
      router.replace("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "github") {
    setError(null);

    // Guard: if we know this provider is not configured, show a friendly message
    // instead of sending the user to an OAuth page that will reject them.
    if (oauthProviders?.[provider] === false) {
      setError(
        `${provider === "google" ? "Google" : "GitHub"} sign-in is not configured on this server. Please use email/password or contact support.`,
      );
      return;
    }

    setBusy(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // New users coming from /join get onboarding after OAuth callback
          redirectTo: origin ? `${origin}/auth/callback?next=/onboarding` : undefined,
        },
      });
      if (oauthError) setError(oauthError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div style={{
          position: 'absolute', top: '-80px', right: '-60px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(200,152,26,0.09) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Header wordmark */}
      <div style={{ marginBottom: 32, textAlign: "center", position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: 'italic', fontWeight: 500,
          fontSize: 36, letterSpacing: '-0.01em', lineHeight: 1,
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #e8d090 0%, #c8981a 60%, #a07820 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>dream</span>
          <span style={{ color: 'rgba(220,235,255,0.60)' }}>engin</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(165,195,235,0.55)", marginTop: 8, letterSpacing: "0.03em" }}>Create your account — it&apos;s free</div>
      </div>

      <div
        className="w-full max-w-md"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Card top accent line */}
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(200,152,26,0.6) 40%, rgba(56,189,248,0.4) 70%, transparent)',
        }} aria-hidden="true" />

        <div style={{ padding: '24px 24px 8px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(210,230,255,0.90)', marginBottom: 20, letterSpacing: '-0.01em' }}>
            Register
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 14,
              background: "rgba(220,68,68,0.10)",
              border: "1px solid rgba(220,68,68,0.25)",
              color: "#f87171", fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {notice && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 14,
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#4ade80", fontSize: 13,
            }}>
              {notice}
            </div>
          )}

          <form onSubmit={signup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(140,170,220,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  ...INPUT_STYLE,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(220,235,255,0.90)',
                  borderRadius: 12,
                }}
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

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(165,195,235,0.72)", minHeight: 44, cursor: "pointer" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#c8981a" }} />
              Remember me
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(165,195,235,0.72)", cursor: "pointer" }}>
              <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: "#c8981a", flexShrink: 0 }} />
              <span>I agree to the <a href="/policy" style={{ color: "#c8981a", textDecoration: "underline" }}>Privacy Policy</a>.</span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(165,195,235,0.72)", cursor: "pointer" }}>
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: "#c8981a", flexShrink: 0 }} />
              <span>I agree to the <a href="/policy" style={{ color: "#38bdf8", textDecoration: "underline" }}>Terms &amp; Conditions</a>.</span>
            </label>

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%', padding: '13px 20px',
                borderRadius: 12, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                background: busy ? 'rgba(200,152,26,0.5)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                boxShadow: busy ? 'none' : '0 4px 20px rgba(245,158,11,0.35)',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Creating…" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 11, color: "rgba(140,170,220,0.45)" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => oauth("google")}
              style={{
                width: '100%', padding: '12px 20px',
                borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(210,230,255,0.85)', fontWeight: 600, fontSize: 13,
                opacity: oauthProviders?.google === false ? DISABLED_BUTTON_OPACITY : 1,
              }}
              title={oauthProviders?.google === false ? "Google sign-in is not configured" : undefined}
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => oauth("github")}
              style={{
                width: '100%', padding: '12px 20px',
                borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(210,230,255,0.85)', fontWeight: 600, fontSize: 13,
                opacity: oauthProviders?.github === false ? DISABLED_BUTTON_OPACITY : 1,
              }}
              title={oauthProviders?.github === false ? "GitHub sign-in is not configured" : undefined}
            >
              Continue with GitHub
            </button>
          </div>
        </div>

        <div style={{
          padding: '14px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 13, color: "rgba(140,170,220,0.55)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#c8981a", fontWeight: 700 }}>Sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
