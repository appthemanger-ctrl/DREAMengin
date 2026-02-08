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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Security</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Password */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors min-h-[44px]">
              Change
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFactor(!twoFactor)}
              className={`w-12 h-7 rounded-full transition-colors ${
                twoFactor ? 'bg-green-500' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                twoFactor ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          {twoFactor && (
            <div className="p-3 bg-green-500/10 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Two-factor authentication is enabled</span>
            </div>
          )}
        </div>

        {/* Recovery Keys */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Recovery Keys</h3>
                <p className="text-sm text-muted-foreground">Backup codes for account recovery</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors min-h-[44px]">
              Generate
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Active Sessions</h3>
                <p className="text-sm text-muted-foreground">Devices logged into your account</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{session.device}</p>
                    {session.current && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.location} - {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <button className="text-sm text-destructive hover:underline">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Alert */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">Security Tip</h3>
              <p className="text-sm text-muted-foreground">
                Enable two-factor authentication and use a unique, strong password to keep your account secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
