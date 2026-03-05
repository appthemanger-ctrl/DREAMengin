'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Smartphone, Key, Shield, AlertTriangle, Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SecuritySettingsPage() {
  const [twoFactor, setTwoFactor] = useState(false);

  // Demo sessions data
  const sessions = [
    { id: 1, device: 'Chrome on MacOS', location: 'San Francisco, CA', current: true, lastActive: 'Now' },
    { id: 2, device: 'Safari on iPhone', location: 'San Francisco, CA', current: false, lastActive: '2 hours ago' },
    { id: 3, device: 'Firefox on Windows', location: 'New York, NY', current: false, lastActive: '3 days ago' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Shield className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Security</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Password */}
        <div className="de-widget">
          <div className="de-widget-body">
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Lock className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Password</h3>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Last changed 30 days ago</p>
              </div>
              <button className="de-btn de-btn-ghost" style={{ minHeight: 44 }}>
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="de-widget">
          <div className="de-widget-body">
            <div className="de-row" style={{ borderBottom: twoFactor ? undefined : 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Smartphone className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Two-Factor Authentication</h3>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Add extra security to your account</p>
              </div>
              <button
                onClick={() => setTwoFactor(!twoFactor)}
                role="switch"
                aria-checked={twoFactor}
                aria-label="Two-Factor Authentication"
                style={{
                  width: 44, height: 26, borderRadius: 13, flexShrink: 0,
                  background: twoFactor ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
                  position: 'relative', cursor: 'pointer', border: 'none',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: twoFactor ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.15s',
                }} />
              </button>
            </div>
            {twoFactor && (
              <div className="de-row" style={{ borderBottom: 'none' }}>
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--de-accent)' }} />
                <span className="text-sm" style={{ color: 'var(--de-accent)' }}>Two-factor authentication is enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Keys */}
        <div className="de-widget">
          <div className="de-widget-body">
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,152,26,0.12)' }}>
                <Key className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Recovery Keys</h3>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Backup codes for account recovery</p>
              </div>
              <button className="de-btn de-btn-ghost" style={{ minHeight: 44 }}>
                Generate
              </button>
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
            {sessions.map((session) => (
              <div key={session.id} className="de-row">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{session.device}</p>
                    {session.current && (
                      <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                    {session.location} · {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <button className="text-sm" style={{ color: '#dc4444' }}>
                    Revoke
                  </button>
                )}
              </div>
            ))}
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
                  Enable two-factor authentication and use a unique, strong password to keep your account secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
