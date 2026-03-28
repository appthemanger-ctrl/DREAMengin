"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(220,235,255,0.90)",
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
      const msg = (err as { message?: string })?.message ?? "Something went wrong";
      setError(
        msg === 'Failed to fetch' || msg.toLowerCase().includes('fetch')
          ? 'Unable to connect. Please check your internet connection and try again.'
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(200,152,26,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      {/* Wordmark */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: 'italic', fontWeight: 500, fontSize: 32,
          letterSpacing: '-0.01em', lineHeight: 1,
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
        }}>
          <span style={{ background: 'linear-gradient(135deg, #e8d090 0%, #c8981a 60%, #a07820 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>dream</span>
          <span style={{ color: 'rgba(220,235,255,0.60)' }}>engin</span>
        </div>
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
        }}
      >
        {/* Card top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(200,152,26,0.55) 40%, rgba(56,189,248,0.35) 70%, transparent)' }} aria-hidden="true" />

        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(210,230,255,0.90)', marginBottom: 20, letterSpacing: '-0.01em' }}>
            Reset Password
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(210,230,255,0.90)", marginBottom: 8 }}>
                Check your email
              </p>
              <p style={{ fontSize: 13, color: "rgba(165,195,235,0.65)" }}>
                We sent a reset link to <strong style={{ color: 'rgba(220,235,255,0.85)' }}>{email}</strong>.
                Click it to set a new password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "rgba(165,195,235,0.60)" }}>
                Enter your email and we will send you a link to reset your password.
              </p>

              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(140,170,220,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
                  background: busy ? 'rgba(56,189,248,0.35)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  boxShadow: busy ? 'none' : '0 4px 20px rgba(14,165,233,0.30)',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: "#c8981a", fontWeight: 700 }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
