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
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<{ google: boolean; github: boolean } | null>(null);

  // Show errors from OAuth callback (e.g. Google auth redirect mismatch)
  // Preflight: check which OAuth providers are configured in Supabase
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setOauthProviders(data))
      .catch(() => setOauthProviders({ google: false, github: false }));
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
      setError((err as { message?: string })?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "github") => {
    setError(null);

    // Guard: if we know this provider is not configured, show a friendly message
    // instead of sending the user to an OAuth page that will reject them.
    if (oauthProviders && !oauthProviders[provider]) {
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
    <div className="de-sky-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">

      {/* dreamengin wordmark */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <span className="de-wordmark" style={{ fontSize: 36 }}><DreamWord />engin</span>
        <div style={{ fontSize: 13, color: "var(--de-text-dim)", marginTop: 6, letterSpacing: "0.04em" }}>
          Welcome back — sign in to your space
        </div>
      </div>

      {/* Form card */}
      <div className="de-widget w-full max-w-md" style={{ background: "rgba(255,255,255,0.93)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
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

            <button type="submit" disabled={busy} className="de-btn de-btn-gold" style={{ width: "100%" }}>
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
            <button
              type="button"
              disabled={busy || oauthProviders?.google === false}
              onClick={() => oauth("google")}
              className="de-btn de-btn-ghost"
              style={{ width: "100%", opacity: oauthProviders?.google === false ? DISABLED_BUTTON_OPACITY : undefined }}
              title={oauthProviders?.google === false ? "Google sign-in is not configured" : undefined}
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled={busy || oauthProviders?.github === false}
              onClick={() => oauth("github")}
              className="de-btn de-btn-ghost"
              style={{ width: "100%", opacity: oauthProviders?.github === false ? DISABLED_BUTTON_OPACITY : undefined }}
              title={oauthProviders?.github === false ? "GitHub sign-in is not configured" : undefined}
            >
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="de-sky-bg min-h-screen flex items-center justify-center">
        <div className="de-widget" style={{ padding: 32, textAlign: 'center' }}>
          <span className="de-wordmark" style={{ fontSize: 28 }}><DreamWord />engin</span>
        </div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
