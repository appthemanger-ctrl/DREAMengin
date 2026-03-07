'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ProfileWidgetGrid, { DEFAULT_WIDGETS, type Widget } from '@/components/profile/ProfileWidgetGrid';

export const dynamic = 'force-dynamic';

type Profile = {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  location: string;
  website: string;
};

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    display_name: '', handle: '', bio: '',
    avatar_url: null, banner_url: null, location: '', website: '',
  });
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState<'widgets' | 'info'>('widgets');
  const supabase = createClient();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({
          display_name: data.display_name || '',
          handle: data.handle || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || null,
          banner_url: data.banner_url || null,
          location: data.location || '',
          website: data.website || '',
        });
      }
      // Load saved widget order
      try {
        const saved = localStorage.getItem('de-profile-widget-order');
        if (saved) setWidgets(JSON.parse(saved));
      } catch { /* noop */ }
      setIsLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profile.display_name,
          handle: profile.handle,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          banner_url: profile.banner_url,
          website: profile.website,
          location: profile.location,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError((data as { error?: string }).error || 'Failed to save.');
        return;
      }
      // Persist widget order locally
      localStorage.setItem('de-profile-widget-order', JSON.stringify(widgets));
      router.push('/profile');
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [profile, widgets, router]);

  const pickAvatar = () => {
    const input = avatarInputRef.current;
    if (!input) return;
    const handler = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => setProfile(p => ({ ...p, avatar_url: e.target?.result as string }));
      reader.readAsDataURL(file);
      input.removeEventListener('change', handler);
    };
    input.addEventListener('change', handler);
    input.click();
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#c8981a' }} />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(160,195,240,0.35)',
    color: 'var(--de-heading)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)',
    marginBottom: 6, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase',
  };

  return (
    <div style={{
      minHeight: '100svh',
      background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)',
      paddingBottom: 100,
    }}>
      {/* ── Sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(220,232,248,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(160,195,240,0.30)',
        padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/profile"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.70)',
              border: '1px solid rgba(160,195,240,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
            }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', margin: 0, lineHeight: 1.1 }}>
              Edit Profile
            </h1>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0, lineHeight: 1 }}>
              Drag widgets to customize your profile
            </p>
          </div>
          {/* View Profile preview button — spec §6.4 */}
          {profile.handle && (
            <Link
              href={`/u/${profile.handle}`}
              target="_blank"
              style={{
                padding: '7px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.70)',
                border: '1px solid rgba(160,195,240,0.30)',
                display: 'flex', alignItems: 'center', gap: 5,
                textDecoration: 'none', color: 'var(--de-heading)',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}
            >
              <Eye size={13} />
              View
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '9px 22px', borderRadius: 12,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              border: 'none', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(200,152,26,0.35)',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, paddingBottom: 2 }}>
          {(['widgets', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#c8981a' : 'var(--de-text-dim)',
                borderBottom: activeTab === tab ? '2.5px solid #c8981a' : '2.5px solid transparent',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'widgets' ? '⊞ Widgets' : '✎ Info'}
            </button>
          ))}
        </div>
      </header>

      {saveError && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.2)',
          color: '#dc4444', fontSize: 13 }}>
          {saveError}
        </div>
      )}

      {/* ── Widgets tab ── */}
      {activeTab === 'widgets' && (
        <div style={{ padding: '16px 14px' }}>
          <ProfileWidgetGrid
            displayName={profile.display_name || profile.handle || 'You'}
            handle={profile.handle}
            avatarUrl={profile.avatar_url}
            bio={profile.bio}
            coverUrl={profile.banner_url}
            isEditing
            initialWidgets={widgets}
            onSave={setWidgets}
          />
        </div>
      )}

      {/* ── Info tab ── */}
      {activeTab === 'info' && (
        <div style={{ padding: '16px 14px' }}>

          {/* Avatar row */}
          <div style={{
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(20px)',
            borderRadius: 22,
            padding: '20px 16px',
            marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <button onClick={pickAvatar} style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden', cursor: 'pointer', border: 'none', padding: 0,
              background: profile.avatar_url ? undefined : 'linear-gradient(135deg, #c8981a, #4A9ED6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', position: 'relative',
            }}>
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile.display_name || 'D')[0]?.toUpperCase()}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>EDIT</span>
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>
                {profile.display_name || 'Your Name'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 2 }}>
                @{profile.handle || 'handle'}
              </div>
              <div style={{ fontSize: 11, color: '#c8981a', marginTop: 4, fontWeight: 600 }}>
                Tap photo to change
              </div>
            </div>
          </div>

          {/* Fields panel */}
          <div style={{
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(20px)',
            borderRadius: 22,
            padding: '18px 16px',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input type="text" value={profile.display_name}
                onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Handle</label>
              <input type="text" value={profile.handle}
                onChange={e => setProfile(p => ({ ...p, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="@yourhandle" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value.slice(0, 160) }))}
                placeholder="UX Designer | Coffee Lover | Traveler"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'right', marginTop: 4 }}>
                {profile.bio.length}/160
              </div>
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input type="text" value={profile.location}
                onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                placeholder="City, Country" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="url" value={profile.website}
                onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                placeholder="https://yoursite.com" style={inputStyle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

