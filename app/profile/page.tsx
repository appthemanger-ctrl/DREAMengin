import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, User, Globe, Share2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Profile – DREAMengin', description: 'Your private profile editor.' };

export default async function ProfileEditorPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const handle = profile?.handle || 'you';

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <User className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Profile</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link href={`/profile/${handle}`} className="de-btn de-btn-ghost text-xs" style={{ padding: '6px 12px' }}>
              <Eye className="w-3 h-3" /> View Public
            </Link>
            <Link href="/edit-profile" className="de-btn de-btn-primary text-xs" style={{ padding: '6px 12px' }}>
              Edit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Profile card preview */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Your Profile Card</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(42,138,184,0.12)', border: '2px solid rgba(42,138,184,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, overflow: 'hidden' }}>
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-bold text-base" style={{ color: 'var(--de-heading)' }}>{profile?.display_name || handle}</div>
                <div className="text-sm" style={{ color: 'var(--de-text-dim)' }}>@{handle}</div>
                {profile?.bio && <div className="text-sm mt-1" style={{ color: 'var(--de-text)', lineHeight: 1.5 }}>{profile.bio}</div>}
              </div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/edit-profile" className="de-btn de-btn-ghost text-xs">Edit Profile</Link>
            <Link href={`/profile/${handle}`} className="de-btn de-btn-primary text-xs">
              <Globe className="w-3 h-3" /> Public View
            </Link>
          </div>
        </div>

        {/* Published widgets */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Published Widgets</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Visible on your public profile</span>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <Globe className="w-8 h-8 opacity-15" style={{ color: 'var(--de-accent)' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No published widgets</p>
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center' }}>
              In Edit Mode, use the ··· menu on any widget to publish it to your profile.
            </p>
          </div>
        </div>

        {/* Share profile */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Share2 className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Share Your Profile</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(160,195,240,0.3)' }}>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--de-text)', fontFamily: 'monospace' }}>
                dreamengin.app/u/{handle}
              </span>
              <button type="button" className="de-btn de-btn-ghost" style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}>Copy</button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="de-widget">
          <div className="de-widget-header">
            <EyeOff className="w-4 h-4 mr-2" style={{ color: 'var(--de-text-dim)' }} />
            <span className="de-widget-title">Privacy Controls</span>
          </div>
          <div className="de-widget-body">
            {[
              { label: 'Public profile visible',  desc: 'Your profile at /u/' + handle + ' is accessible to anyone.', on: true },
              { label: 'Show follow button',       desc: 'Allow others to follow your public profile.',                on: true },
              { label: 'Allow profile in search',  desc: 'Your profile appears in Discover search results.',          on: true },
            ].map(({ label, desc, on }) => (
              <div key={label} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="de-widget-actions">
            <Link href="/settings/privacy" className="de-btn de-btn-ghost text-xs">Full Privacy Settings →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
