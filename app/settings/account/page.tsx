import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DangerZoneActions from './DangerZoneActions';
import { ArrowLeft, User, Mail, Calendar, Shield, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.88)', borderBottom: '1px solid rgba(160,195,240,0.28)', boxShadow: '0 1px 0 rgba(200,152,26,0.08), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--de-text)' }} />
          </Link>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--de-blue), var(--de-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(42,138,184,0.28)' }}>
            <User className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)', letterSpacing: '-0.02em' }}>Account</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Account info card */}
        <div className="de-widget" style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(160,195,240,0.22)' }}>
          <div className="de-widget-header"><span className="de-widget-title">Your Account</span></div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {/* Email */}
            <div className="de-row" style={{ borderBottom: '1px solid rgba(160,195,240,0.12)', minHeight: 60 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(42,138,184,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)', marginBottom: 2 }}>Email</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{user.email}</p>
              </div>
            </div>

            {/* Handle */}
            <div className="de-row" style={{ borderBottom: '1px solid rgba(160,195,240,0.12)', minHeight: 60 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(200,152,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)', marginBottom: 2 }}>Username</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>@{profile?.handle || 'Not set'}</p>
              </div>
            </div>

            {/* Created At */}
            <div className="de-row" style={{ borderBottom: '1px solid rgba(160,195,240,0.12)', minHeight: 60 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar className="w-5 h-5" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)', marginBottom: 2 }}>Member Since</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Verified Status */}
            <div className="de-row" style={{ minHeight: 60 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: user.email_confirmed_at ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield className="w-5 h-5" style={{ color: user.email_confirmed_at ? '#10b981' : '#f59e0b' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)', marginBottom: 2 }}>Email Verified</p>
                <p className="text-sm font-semibold" style={{ color: user.email_confirmed_at ? '#10b981' : '#f59e0b' }}>
                  {user.email_confirmed_at ? '✓ Verified' : 'Not verified'}
                </p>
              </div>
            </div>
          </div>
          <div className="de-widget-actions" style={{ flexDirection: 'column', gap: 10 }}>
            <Link href="/edit-profiledream" className="de-btn de-btn-primary" style={{ width: '100%', textAlign: 'center', borderRadius: 14, minHeight: 50 }}>
              Edit Profile
            </Link>
            <Link href="/settings/security" className="de-btn de-btn-ghost" style={{ width: '100%', textAlign: 'center', borderRadius: 14, minHeight: 50 }}>
              Change Password
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="de-widget" style={{ border: '1px solid rgba(220,68,68,0.22)', background: 'rgba(255,255,255,0.97)', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          <div className="de-widget-header" style={{ background: 'rgba(220,68,68,0.04)', borderBottom: '1px solid rgba(220,68,68,0.12)' }}>
            <Trash2 className="w-4 h-4 mr-2" style={{ color: '#dc4444' }} />
            <span className="de-widget-title" style={{ color: '#dc4444' }}>Danger Zone</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm mb-4" style={{ color: 'var(--de-text-dim)', lineHeight: 1.55 }}>
              These actions are destructive and cannot be undone. Proceed with care.
            </p>
            <DangerZoneActions />
          </div>
        </div>
      </div>
    </div>
  );
}
