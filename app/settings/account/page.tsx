import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DangerZoneActions from './DangerZoneActions';
import { ArrowLeft, User, Mail, Calendar, Shield } from 'lucide-react';

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
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <User className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Account Information</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Your Account</span></div>
          <div className="de-widget-body">
            {/* Email */}
            <div className="de-row">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Mail className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Email</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{user.email}</p>
              </div>
            </div>

            {/* Handle */}
            <div className="de-row">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <User className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Username</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>@{profile?.handle || 'Not set'}</p>
              </div>
            </div>

            {/* Created At */}
            <div className="de-row">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Member Since</p>
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
            <div className="de-row" style={{ borderBottom: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                <Shield className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Email Verified</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>
                  {user.email_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
          <div className="de-widget-actions" style={{ flexDirection: 'column', gap: 10 }}>
            <Link href="/edit-profiledream" className="de-btn de-btn-primary" style={{ width: '100%', textAlign: 'center' }}>
              Edit ProfileDream
            </Link>
            <Link href="/settings/security" className="de-btn de-btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
              Change Password
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="de-widget" style={{ borderColor: 'rgba(220,68,68,0.3)' }}>
          <div className="de-widget-header" style={{ borderColor: 'rgba(220,68,68,0.2)' }}>
            <span className="de-widget-title" style={{ color: '#dc4444' }}>Danger Zone</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm mb-4" style={{ color: 'var(--de-text-dim)' }}>
              These actions are destructive and may not be reversible.
            </p>
            <DangerZoneActions />
          </div>
        </div>
      </div>
    </div>
  );
}
