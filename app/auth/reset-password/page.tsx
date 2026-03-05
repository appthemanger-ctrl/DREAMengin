"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${origin}/auth/callback?next=/auth/update-password` },
      );
      if (authError) throw authError;
      setSent(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="de-sky-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="de-widget w-full max-w-md">
        <div className="de-widget-header">
          <span className="de-widget-title">Reset Password</span>
        </div>

        <div className="de-widget-body" style={{ paddingTop: 18, paddingBottom: 18 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--de-heading)", marginBottom: 8 }}>
                Check your email
              </p>
              <p style={{ fontSize: 13, color: "var(--de-text-dim)" }}>
                We sent a reset link to <strong>{email}</strong>.
                Click it to set a new password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--de-text-dim)" }}>
                Enter your email and we will send you a link to reset your password.
              </p>

              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--de-text-dim)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Email
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  style={INPUT_STYLE}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                {busy ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <div className="de-widget-actions" style={{ justifyContent: "center" }}>
          <Link href="/login" style={{ fontSize: 13, color: "var(--de-accent)", fontWeight: 700 }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
