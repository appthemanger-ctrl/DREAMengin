'use client';

/**
 * ProfilePanel — inline Edit ProfileDream panel.
 * Same logic as app/edit-profiledream/page.tsx but rendered within PanelHost.
 * No page chrome (no min-h-screen, no sticky header with back Links).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient }   from '@/lib/supabase/client';
import { Eye, Loader2, Share2 } from 'lucide-react';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
import DreamWord          from '@/components/ui/DreamWord';

type Profile = {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  location: string;
  website: string;
};

export default function ProfilePanel() {
  const [profile, setProfile] = useState<Profile>({
    display_name: '', handle: '', bio: '',
    avatar_url: null, banner_url: null, location: '', website: '',
  });
  const [widgets, setWidgets]               = useState<ProfileDream[]>(DEFAULT_DREAMS);
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [initialWidgets, setInitialWidgets] = useState<ProfileDream[]>(DEFAULT_DREAMS);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSaving, setIsSaving]             = useState(false);
  const [isPublishing, setIsPublishing]     = useState(false);
  const [saveError, setSaveError]           = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [activeTab, setActiveTab]           = useState<'widgets' | 'info'>('widgets');
  const supabase       = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const loaded: Profile = {
        display_name: data?.display_name || '',
        handle:       data?.handle       || '',
        bio:          data?.bio          || '',
        avatar_url:   data?.avatar_url   || null,
        banner_url:   data?.banner_url   || null,
        location:     data?.location     || '',
        website:      data?.website      || '',
      };
      setProfile(loaded);
      let loadedDreams: ProfileDream[] = DEFAULT_DREAMS;
      if (data?.profile_dream_widgets && Array.isArray(data.profile_dream_widgets) && data.profile_dream_widgets.length > 0) {
        loadedDreams = data.profile_dream_widgets as ProfileDream[];
      } else {
        try {
          const saved = localStorage.getItem('de-profile-widget-order');
          if (saved) loadedDreams = JSON.parse(saved);
        } catch { /* noop */ }
      }
      setWidgets(loadedDreams);
      setInitialProfile(loaded);
      setInitialWidgets(loadedDreams);
      setIsLoading(false);
    })();
   
  }, []);

  const isDirty = !!initialProfile && (
    JSON.stringify(profile) !== JSON.stringify(initialProfile) ||
    JSON.stringify(widgets)  !== JSON.stringify(initialWidgets)
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true); setSaveError(''); setPublishSuccess(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profile.display_name, handle: profile.handle,
          bio: profile.bio, avatar_url: profile.avatar_url,
          banner_url: profile.banner_url, website: profile.website,
          location: profile.location, widget_order: widgets,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError((d as { error?: string }).error || 'Failed to save.'); return;
      }
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ widget_config: widgets }) });
      localStorage.setItem('de-profile-widget-order', JSON.stringify(widgets));
      setInitialProfile(profile); setInitialWidgets(widgets);
    } catch { setSaveError('Network error. Please try again.'); }
    finally { setIsSaving(false); }
  }, [profile, widgets]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true); setSaveError(''); setPublishSuccess(false);
    try {
      const saveRes = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profile.display_name, handle: profile.handle,
          bio: profile.bio, avatar_url: profile.avatar_url,
          banner_url: profile.banner_url, website: profile.website,
          location: profile.location, widget_order: widgets, widget_config: widgets,
        }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json().catch(() => ({}));
        setSaveError((d as { error?: string }).error || 'Failed to save before publishing.'); return;
      }
      const publicWidgets = widgets.filter(
        (w) => w.visibility != null && (w.visibility === 'public' || w.visibility === 'followers')
      );
      await fetch('/api/ai/boogieman/privacy-event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'PROFILE_PUBLISH', content_id: 'profile_info', content_type: 'profile_info', to_visibility: 'public', update_mapping: true }) });
      await Promise.allSettled(publicWidgets.map((w) =>
        fetch('/api/ai/boogieman/privacy-event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: 'EXPLICIT_SHARE', content_id: w.id, content_type: 'dream_window', to_visibility: w.visibility ?? 'public', update_mapping: true }) })
      ));
      localStorage.setItem('de-profile-widget-order', JSON.stringify(widgets));
      setInitialProfile(profile); setInitialWidgets(widgets); setPublishSuccess(true);
    } catch { setSaveError('Network error during publish. Please try again.'); }
    finally { setIsPublishing(false); }
  }, [profile, widgets]);

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(160,195,240,0.35)',
    color: 'var(--de-heading)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)',
    marginBottom: 6, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader2 className="animate-spin" size={28} style={{ color: '#c8981a' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* ── Action bar (save / publish / preview) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(160,195,240,0.2)',
        background: 'rgba(220,232,248,0.7)',
        backdropFilter: 'blur(12px)',
        flexWrap: 'wrap',
      }}>
        {profile.handle && (
          <button type="button" onClick={() => { window.location.href = '/view-profile'; }}
            style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.70)',
              border: '1px solid rgba(160,195,240,0.3)', display: 'flex', alignItems: 'center', gap: 5,
              color: 'var(--de-heading)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Eye size={13} /> Preview
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={handleSave} disabled={isSaving || isPublishing || !isDirty}
          style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(160,195,240,0.45)', color: 'var(--de-heading)',
            fontWeight: 600, fontSize: 12, cursor: !isDirty ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, opacity: isSaving ? 0.7 : isDirty ? 1 : 0.5 }}>
          {isSaving && <Loader2 size={12} className="animate-spin" />}
          {isDirty ? 'Save Draft' : 'Saved'}
        </button>
        <button type="button" onClick={handlePublish} disabled={isSaving || isPublishing}
          style={{ padding: '9px 16px', borderRadius: 12,
            background: 'linear-gradient(135deg,#c8981a,#e0b830)', border: 'none', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: isPublishing ? 'default' : 'pointer',
            boxShadow: '0 4px 14px rgba(200,152,26,0.35)', display: 'flex', alignItems: 'center', gap: 6,
            opacity: isPublishing ? 0.7 : 1 }}>
          {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
          {isPublishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(160,195,240,0.2)' }}>
        {(['widgets', 'info'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
            color: activeTab === tab ? '#c8981a' : 'var(--de-text-dim)',
            borderBottom: activeTab === tab ? '2.5px solid #c8981a' : '2.5px solid transparent',
            transition: 'all 0.15s', textTransform: 'capitalize',
          }}>
            {tab === 'widgets' ? '⊞ Dreams' : '✎ Info'}
          </button>
        ))}
      </div>

      {/* ── Errors / success ── */}
      {saveError && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.2)',
          color: '#dc4444', fontSize: 13 }}>{saveError}</div>
      )}
      {publishSuccess && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(200,152,26,0.10)', border: '1px solid rgba(200,152,26,0.30)',
          color: '#a07828', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={14} /> Published! Your public Dream Windows are now visible on ViewProfile.
        </div>
      )}

      {/* ── Widgets tab ── */}
      {activeTab === 'widgets' && (
        <div style={{ padding: '16px 14px' }}>
          <ProfileWidgetGrid
            displayName={profile.display_name || profile.handle || 'You'}
            handle={profile.handle} avatarUrl={profile.avatar_url}
            bio={profile.bio} coverUrl={profile.banner_url}
            isEditing initialWidgets={widgets} onSave={setWidgets}
          />
        </div>
      )}

      {/* ── Info tab ── */}
      {activeTab === 'info' && (
        <div style={{ padding: '16px 14px' }}>
          {/* Avatar row */}
          <div style={{
            background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(20px)',
            borderRadius: 22, padding: '20px 16px', marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <button type="button" onClick={pickAvatar} style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden', cursor: 'pointer', border: 'none', padding: 0,
              background: profile.avatar_url ? undefined : 'linear-gradient(135deg,#c8981a,#4A9ED6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', position: 'relative',
            }}>
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile.display_name || 'D')[0]?.toUpperCase()}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>EDIT</span>
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>{profile.display_name || 'Your Name'}</div>
              <div style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 2 }}>@{profile.handle || 'handle'}</div>
              <div style={{ fontSize: 11, color: '#c8981a', marginTop: 4, fontWeight: 600 }}>Tap photo to change</div>
            </div>
          </div>

          {/* Fields */}
          <div style={{
            background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(20px)',
            borderRadius: 22, padding: '18px 16px',
            border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
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
                placeholder="UX Designer | Coffee Lover | Traveler" rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'right', marginTop: 4 }}>{profile.bio.length}/160</div>
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

      <div style={{ height: 40 }} />
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
          <DreamWord />engin stores your profile privately until you tap <strong>Publish</strong>.
        </p>
      </div>
    </div>
  );
}
