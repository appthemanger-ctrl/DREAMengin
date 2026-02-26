'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: 'var(--de-mist)',
  border: '1px solid var(--de-border)',
  color: 'var(--de-text)',
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--de-text-dim)',
  marginBottom: 6,
  display: 'block',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    handle: '',
    bio: '',
    avatar_url: null,
    banner_url: null,
    location: '',
    website: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const supabase = createClient();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
      setIsLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFile = (ref: React.RefObject<HTMLInputElement | null>, field: 'avatar_url' | 'banner_url') => {
    const input = ref.current;
    if (!input) return;
    const handleChange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setProfile((p) => ({ ...p, [field]: dataUrl }));
      };
      reader.readAsDataURL(file);
      input.removeEventListener('change', handleChange);
    };
    input.addEventListener('change', handleChange);
    input.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
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
        setSaveError((data as { error?: string }).error || 'Failed to save. Please try again.');
        return;
      }
      router.push('/profile');
    } catch {
      setSaveError('Network error. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="de-sky-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--de-accent)' }} />
      </div>
    );
  }

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 de-glass"
        style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        <div className="flex items-center gap-3" style={{ padding: '14px 16px' }}>
          <Link
            href="/profile"
            className="flex items-center justify-center"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--de-heading)' }} />
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--de-heading)', flex: 1 }}>Edit Profile</h1>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={isSaving}
            className="de-btn de-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px' }}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </header>

      <form id="edit-profile-form" onSubmit={handleSave}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 0 40px' }}>

          {/* Banner */}
          <div
            onClick={() => pickFile(bannerInputRef, 'banner_url')}
            style={{
              height: 120,
              background: profile.banner_url
                ? undefined
                : 'linear-gradient(135deg, var(--de-bg-start), var(--de-bg-mid), var(--de-bg-end))',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {profile.banner_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.18)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'white', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20 }}>
                {profile.banner_url ? 'Change Banner' : 'Upload Banner'}
              </span>
            </div>
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} />

          {/* Avatar + fields */}
          <div style={{ padding: '0 16px' }}>
            {/* Avatar */}
            <div style={{ marginTop: -36, marginBottom: 16 }}>
              <div
                onClick={() => pickFile(avatarInputRef, 'avatar_url')}
                style={{
                  width: 76, height: 76, borderRadius: '50%',
                  border: '3px solid var(--de-bg-start)',
                  cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: 'white',
                }}
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile.display_name || 'D')[0]?.toUpperCase()
                )}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>EDIT</span>
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
            </div>

            <div className="de-widget" style={{ marginBottom: 16 }}>
              <div className="de-widget-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div>
                  <label style={labelStyle}>Display Name</label>
                  <input
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Handle</label>
                  <input
                    type="text"
                    value={profile.handle}
                    onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="@yourhandle"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value.slice(0, 160) }))}
                    placeholder="Tell the world about yourself..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'right', marginTop: 4 }}>
                    {profile.bio.length}/160
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                    placeholder="City, Country"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Website</label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://yoursite.com"
                    style={inputStyle}
                  />
                </div>

              </div>
            </div>
          </div>

          {saveError && (
            <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 0 8px' }}>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.2)', color: 'var(--de-red)', fontSize: 13 }}>
                {saveError}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}