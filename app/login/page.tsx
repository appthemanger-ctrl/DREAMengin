"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DreamWord from "@/components/ui/DreamWord";

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

const DISABLED_BUTTON_OPACITY = 0.45;

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<{ google: boolean | null; github: boolean | null } | null>(null);

  // Show errors from OAuth callback (e.g. Google auth redirect mismatch)
  // Preflight: check which OAuth providers are configured in Supabase
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
    const cbError = searchParams.get("error");
    const cbErrorDesc = searchParams.get("error_description");
    if (cbError) {
      const friendlyErrors: Record<string, string> = {
        access_denied: "Sign-in was cancelled. Please try again.",
        exchange_failed: "Authentication failed. Please try again.",
        // Google returns these when the redirect URI is not in the allowed list
        redirect_uri_mismatch:
          "Google sign-in is misconfigured (redirect URI mismatch). Please use email/password or contact support.",
        invalid_client:
          "Google sign-in is misconfigured (invalid client). Please use email/password or contact support.",
        // Supabase / generic OAuth errors
        server_error: "A server error occurred during sign-in. Please try again.",
        temporarily_unavailable:
          "The sign-in service is temporarily unavailable. Please try again shortly.",
      };
      setError(friendlyErrors[cbError] ?? cbErrorDesc ?? `Sign-in error: ${cbError}`);
    }
  }, [searchParams]);

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
      router.replace("/homedream");
      router.refresh();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Login failed";
      setError(
        msg === 'Failed to fetch' || msg.toLowerCase().includes('fetch')
          ? 'Unable to connect. Please check your internet connection and try again.'
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "github") => {
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

      {/* Wordmark */}
      <div style={{ marginBottom: 32, textAlign: "center", position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: 'italic', fontWeight: 500,
          fontSize: 36, letterSpacing: '-0.01em', lineHeight: 1,
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0,
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #e8d090 0%, #c8981a 60%, #a07820 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>dream</span>
          <span style={{ color: 'rgba(220,235,255,0.60)' }}>engin</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(165,195,235,0.55)", marginTop: 8, letterSpacing: "0.03em" }}>
          Welcome back — sign in to your space
        </div>
      </div>

      {/* Form card — dark glass */}
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
            Sign In
          </div>
          <form onSubmit={signIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(140,170,220,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Email
              </span>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                style={{
                  ...INPUT_STYLE,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(220,235,255,0.90)',
                  borderRadius: 12,
                }}
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
              <Link href="/auth/reset-password" style={{ fontSize: 12, color: '#c8981a', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(165,195,235,0.72)", minHeight: 44, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#c8981a" }}
              />
              Remember me
            </label>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: "rgba(220,68,68,0.10)",
                border: "1px solid rgba(220,68,68,0.25)",
                color: "#f87171", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%', padding: '13px 20px',
                borderRadius: 12, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                background: busy ? 'rgba(200,152,26,0.5)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                boxShadow: busy ? 'none' : '0 4px 20px rgba(245,158,11,0.35)',
                transition: 'opacity 0.15s, box-shadow 0.15s',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Signing in…" : "Sign In"}
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
            New here?{" "}
            <Link href="/join" style={{ color: "#c8981a", fontWeight: 700 }}>
              Create an account
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)' }}
      >
        <div style={{
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: 'italic', fontSize: 32,
          background: 'linear-gradient(135deg, #e8d090, #c8981a)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>dreamEngin</div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
