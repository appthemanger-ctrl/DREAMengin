'use client';

/**
 * Security Settings page.
 *
 * - Change Password → triggers Supabase password reset email (real action)
 * - Two-Factor Authentication → informational state, Supabase MFA enrollment
 * - Recovery Keys → informational, links to Supabase support
 * - Active Sessions → shows current session only (honest: we cannot enumerate all sessions server-side without admin SDK)
 *
 * Architecture justification: Constitution Rule 6-7 (every visible action must
 * do something real). No fake demo sessions shown.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Lock, Smartphone, Key, Shield, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';


export default function SecuritySettingsPage() {
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const supabase = createClient();

  const handleChangePassword = useCallback(async () => {
    setPwLoading(true);
    setPwMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setPwMsg('Could not retrieve your email. Please sign in again.');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setPwMsg(error.message);
      } else {
        setPwMsg('Password reset email sent. Check your inbox.');
      }
    } catch {
      setPwMsg('Something went wrong. Please try again.');
    } finally {
      setPwLoading(false);
    }
  }, [supabase]);

  return (
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/settings"
        title="Security"
        subtitle="Passwords, sessions, MFA guidance, and account safety in one place."
        icon={<Shield className="w-4 h-4" />}
        accentColor="var(--de-accent)"
        badge="Settings"
      />

      <div className="de-auth-content space-y-4">

        {/* Password */}
        <div className="de-widget">
          <div className="de-widget-body">
            <div className="de-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                  <Lock className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Password</h3>
                  <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                    Sends a reset link to your email address.
                  </p>
                </div>
                <button
                  type="button"
                  className="de-btn de-btn-ghost"
                  style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                >
                  {pwLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {pwLoading ? 'Sending…' : 'Reset Password'}
                </button>
              </div>
              {pwMsg && (
                <p style={{
                  fontSize: 12,
                  color: pwMsg.includes('sent') ? '#22c55e' : '#dc4444',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {pwMsg.includes('sent') ? <Check className="w-3 h-3" /> : null}
                  {pwMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication — informational */}
        <div className="de-widget">
          <div className="de-widget-body">
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Smartphone className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Two-Factor Authentication</h3>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                  Managed through your Supabase account settings. Use the Supabase dashboard to enable MFA.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Active Sessions</span>
          </div>
          <div className="de-widget-body" style={{ padding: 0 }}>
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Current session</p>
                  <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)' }}>
                    Active
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                  Sign out of all other sessions by using the Sign Out option in Settings.
                </p>
              </div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/api/auth/logout" className="de-btn de-btn-ghost text-xs" style={{ color: '#dc4444' }}>
              Sign Out Everywhere
            </Link>
          </div>
        </div>

        {/* Security Tip */}
        <div className="de-widget" style={{ borderColor: 'rgba(200,152,26,0.3)' }}>
          <div className="de-widget-body">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--de-gold)' }} />
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--de-heading)' }}>Security Tip</h3>
                <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
                  Use a unique, strong password for your Dreamengin account and never share your login credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
