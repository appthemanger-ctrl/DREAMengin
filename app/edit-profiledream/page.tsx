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

export default function EditProfileDreamPage() {
  const [profile, setProfile] = useState<Profile>({
    display_name: '', handle: '', bio: '',
    avatar_url: null, banner_url: null, location: '', website: '',
  });
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [initialWidgets, setInitialWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
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
      const loadedProfile = {
        display_name: data?.display_name || '',
        handle: data?.handle || '',
        bio: data?.bio || '',
        avatar_url: data?.avatar_url || null,
        banner_url: data?.banner_url || null,
        location: data?.location || '',
        website: data?.website || '',
      };
      setProfile(loadedProfile);

      let loadedWidgets = DEFAULT_WIDGETS;
      try {
        const saved = localStorage.getItem('de-profile-widget-order');
        if (saved) loadedWidgets = JSON.parse(saved);
      } catch { /* noop */ }

      setWidgets(loadedWidgets);
      setInitialProfile(loadedProfile);
      setInitialWidgets(loadedWidgets);
      setIsLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = !!initialProfile && (
    JSON.stringify(profile) !== JSON.stringify(initialProfile) ||
    JSON.stringify(widgets) !== JSON.stringify(initialWidgets)
  );

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
      setInitialProfile(profile);
      setInitialWidgets(widgets);
      router.push('/view-profile');
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
          <Link href="/view-profile"
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
              Edit ProfileDream
            </h1>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0, lineHeight: 1 }}>
              Editing Profile Dream
            </p>
          </div>
          {/* View Profile preview button — spec §6.4 */}
          {profile.handle && (
            <Link
              href={`/profile/${profile.handle}`}
              
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
              View Profile
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            style={{
              padding: '9px 22px', borderRadius: 12,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              border: 'none', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: isSaving || !isDirty ? 'default' : 'pointer',
              boxShadow: '0 4px 14px rgba(200,152,26,0.35)',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isSaving ? 0.7 : isDirty ? 1 : 0.55,
            }}
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isDirty ? 'Save' : 'Saved'}
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
                background: 'none', border: 'none', cursor: isSaving || !isDirty ? 'default' : 'pointer',
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#c8981a' : 'var(--de-text-dim)',
                borderBottom: activeTab === tab ? '2.5px solid #c8981a' : '2.5px solid transparent',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'widgets' ? '⊞ Dreams' : '✎ Info'}
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

          {/* ── My Dream Profile section header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)' }}>My Dream Profile</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
                Private builder — set visibility per Dream
              </div>
            </div>
            <button type="button" style={{
              background: 'rgba(255,255,255,0.70)',
              border: '1px solid rgba(160,195,240,0.30)',
              borderRadius: 10, padding: '6px 12px',
              fontSize: 16, color: 'var(--de-text-dim)', cursor: 'pointer',
              fontWeight: 700, lineHeight: 1,
            }}>
              ···
            </button>
          </div>

          {/* ── My Vibe music widget (Mockup 3) ── */}
          <div style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.90)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            {/* Widget header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px 10px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>My Vibe</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#c8981a',
                  background: 'rgba(200,152,26,0.12)',
                  border: '1px solid rgba(200,152,26,0.25)',
                  borderRadius: 100, padding: '3px 8px',
                }}>
                  Music
                </span>
                <button type="button" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, color: 'var(--de-text-dim)', padding: 0, lineHeight: 1,
                }}>
                  ×
                </button>
              </div>
            </div>

            {/* Concert image placeholder */}
            <div style={{
              height: 140,
              background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1654 40%, #c8981a44 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              margin: '0 14px',
              borderRadius: 14,
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 42, opacity: 0.8 }}>🎤</span>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                borderRadius: '0 0 14px 14px',
              }} />
            </div>

            {/* Song info + playback */}
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 2 }}>
                Starlight Muse ft MOON
              </div>
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
                Tick &amp; remsecia s feuiltile
              </div>
              {/* Playback controls */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'center' }}>
                {['⏮', '⏸', '⏭'].map(icon => (
                  <button key={icon} type="button" style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: 'var(--de-heading)', padding: 0,
                  }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Drag Dream section ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)' }}>Drag Dream</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Drag to reorder</span>
          </div>

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

          {/* ── Gold infinity button ── */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              boxShadow: '0 6px 24px rgba(200,152,26,0.50)',
              fontSize: 26, color: '#fff', fontWeight: 800,
              cursor: 'pointer',
            }}>
              ∞
            </div>
          </div>
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
              overflow: 'hidden', cursor: isSaving || !isDirty ? 'default' : 'pointer', border: 'none', padding: 0,
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

