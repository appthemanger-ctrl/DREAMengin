"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/components/auth/PasswordField";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setSuccess(true);
      router.replace("/login");
      router.refresh();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Unable to update password";
      setError(
        msg === "Failed to fetch" || msg.toLowerCase().includes("fetch")
          ? "Unable to connect. Please check your internet connection and try again."
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-80px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 40%, transparent 65%)",
            filter: "blur(80px)",
            animation: "sicc-soft-float 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-50px",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(200,152,26,0.11) 0%, rgba(200,152,26,0.03) 40%, transparent 65%)",
            filter: "blur(80px)",
            animation: "sicc-soft-float 6s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="sicc-soft-float" style={{ marginBottom: 32, textAlign: "center", position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 40,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
          }}
        >
          <span className="sicc-gradient-text" style={{ fontSize: "inherit" }}>
            dream
          </span>
          <span style={{ color: "rgba(220,235,255,0.55)", fontWeight: 400 }}>engin</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(165,195,235,0.50)", marginTop: 10, letterSpacing: "0.04em" }}>
          Choose a new password for your space
        </div>
      </div>

      <div
        className="w-full max-w-md sicc-glass-in"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(40px) saturate(170%)",
          WebkitBackdropFilter: "blur(40px) saturate(170%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 24,
          boxShadow: "0 8px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.10)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(200,152,26,0.55) 40%, rgba(56,189,248,0.35) 70%, transparent)",
          }}
          aria-hidden="true"
        />

        <div style={{ padding: "24px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(210,230,255,0.90)", marginBottom: 20, letterSpacing: "-0.01em" }}>
            Update Password
          </div>

          {success ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(210,230,255,0.90)", marginBottom: 8 }}>
                Password updated
              </p>
              <p style={{ fontSize: 13, color: "rgba(165,195,235,0.65)" }}>
                Redirecting you back to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "rgba(165,195,235,0.60)" }}>
                Enter your new password below to finish your Supabase recovery flow.
              </p>

              <PasswordField
                label="New Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(220,68,68,0.10)",
                    border: "1px solid rgba(220,68,68,0.25)",
                    color: "#f87171",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 12,
                  border: "none",
                  cursor: busy ? "not-allowed" : "pointer",
                  background: busy ? "rgba(56,189,248,0.35)" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: busy ? "none" : "0 4px 20px rgba(14,165,233,0.30)",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Updating…" : "Save New Password"}
              </button>
            </form>
          )}
        </div>

        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: 13, color: "#c8981a", fontWeight: 700 }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
