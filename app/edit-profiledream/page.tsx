'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import ProfileWidgetGrid, { DEFAULT_DREAMS, type ProfileDream } from '@/components/profile/ProfileWidgetGrid';
import DreamWord from '@/components/ui/DreamWord';

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
  const [widgets, setWidgets] = useState<ProfileDream[]>(DEFAULT_DREAMS);
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [initialWidgets, setInitialWidgets] = useState<ProfileDream[]>(DEFAULT_DREAMS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // isPublishing tracks the explicit share/publish action (distinct from private save)
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
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

      // Load Dream projection from Supabase (server-persisted projection state)
      // Fall back to localStorage for migration compatibility, then DEFAULT_DREAMS
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
      setInitialProfile(loadedProfile);
      setInitialWidgets(loadedDreams);
      setIsLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = !!initialProfile && (
    JSON.stringify(profile) !== JSON.stringify(initialProfile) ||
    JSON.stringify(widgets) !== JSON.stringify(initialWidgets)
  );

  /**
   * Private save — persists profile and Dream Window config to the database
   * WITHOUT changing any visibility records. This is a draft save only.
   * Per Phase 6 spec points 14–15: draft state must never appear on ViewProfile
   * before the user saves AND explicitly chooses to share.
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true); setSaveError(''); setPublishSuccess(false);
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
          widget_order: widgets,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError((data as { error?: string }).error || 'Failed to save.');
        return;
      }
      // Persist widget config to profile (widget_config column) and localStorage as backup
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widget_config: widgets }),
      });
      localStorage.setItem('de-profile-widget-order', JSON.stringify(widgets));
      setInitialProfile(profile);
      setInitialWidgets(widgets);
      // Private save — stay on EditProfileDream, not navigate to ViewProfile.
      // The user must explicitly publish to update their public profile.
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [profile, widgets]);

  /**
   * Explicit publish — saves the profile AND logs a BoogieMan privacy event
   * to update the visibility_mappings for publicly visible Dream Windows.
   * Per Phase 6 spec points 15, 17: only an explicit share action updates
   * the public projection. This is the "Publish to Profile" action.
   */
  const handlePublish = useCallback(async () => {
    setIsPublishing(true); setSaveError(''); setPublishSuccess(false);
    try {
      // Step 1: Save the draft first (private save).
      const saveRes = await fetch('/api/profile', {
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
          widget_order: widgets,
          widget_config: widgets,
        }),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        setSaveError((data as { error?: string }).error || 'Failed to save before publishing.');
        return;
      }

      // Step 2: Log the PROFILE_PUBLISH event through TheBoogieMan privacy-event endpoint.
      // This updates visibility_mappings for all publicly-visible Dream Windows.
      const publicWidgets = widgets.filter(
        (w) => w.visibility != null && (w.visibility === 'public' || w.visibility === 'followers')
      );

      // Log a single PROFILE_PUBLISH event for the profile itself.
      await fetch('/api/ai/boogieman/privacy-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'PROFILE_PUBLISH',
          content_id: 'profile_info',
          content_type: 'profile_info',
          to_visibility: 'public',
          update_mapping: true,
        }),
      });

      // Log EXPLICIT_SHARE events for each publicly visible Dream Window.
      await Promise.allSettled(
        publicWidgets.map((w) =>
          fetch('/api/ai/boogieman/privacy-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'EXPLICIT_SHARE',
              content_id: w.id,
              content_type: 'dream_window',
              to_visibility: w.visibility ?? 'public',
              update_mapping: true,
            }),
          })
        )
      );

      localStorage.setItem('de-profile-widget-order', JSON.stringify(widgets));
      setInitialProfile(profile);
      setInitialWidgets(widgets);
      setPublishSuccess(true);
      // Navigate to ViewProfile to confirm the published output.
      router.push('/view-profile');
    } catch {
      setSaveError('Network error during publish. Please try again.');
    } finally {
      setIsPublishing(false);
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
      {/* ── Inline header (not sticky — DreamDMBar is the persistent navigation) ── */}
      <header style={{
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
              Edit Profile<DreamWord />
            </h1>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0, lineHeight: 1 }}>
              Arrange Dreams and choose what View Profile exposes
            </p>
          </div>
          {/* View Profile preview button — spec §6.4 */}
          {profile.handle && (
            <Link
              href="/view-profile"
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
              Preview
            </Link>
          )}

          {/* Save Draft — private save only, no visibility change (Phase 6 §15) */}
          <button
            onClick={handleSave}
            disabled={isSaving || isPublishing || !isDirty}
            title="Save changes privately — does not update your public profile"
            style={{
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(160,195,240,0.45)',
              color: 'var(--de-heading)',
              fontWeight: 600, fontSize: 12, cursor: isSaving || isPublishing || !isDirty ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              opacity: isSaving ? 0.7 : isDirty ? 1 : 0.50,
            }}
          >
            {isSaving && <Loader2 size={12} className="animate-spin" />}
            {isDirty ? 'Save Draft' : 'Saved'}
          </button>

          {/* Publish to Profile — explicit share action, updates visibility_mappings (Phase 6 §15,17) */}
          <button
            onClick={handlePublish}
            disabled={isSaving || isPublishing}
            title="Publish your profile — makes public Dream Windows visible on your View Profile surface"
            style={{
              padding: '9px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              border: 'none', color: '#fff',
              fontWeight: 700, fontSize: 13, cursor: isSaving || isPublishing ? 'default' : 'pointer',
              boxShadow: '0 4px 14px rgba(200,152,26,0.35)',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              opacity: isPublishing ? 0.7 : 1,
            }}
          >
            {isPublishing
              ? <Loader2 size={13} className="animate-spin" />
              : <Share2 size={13} />}
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>

        {/* Tab bar — inline, scrolls with page */}
        <div style={{ display: 'flex', gap: 0, paddingBottom: 2 }}>
          {(['widgets', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 0',
                background: 'none', border: 'none', cursor: isSaving || isPublishing ? 'default' : 'pointer',
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

      {/* Publish success banner — shown briefly after explicit publish */}
      {publishSuccess && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(200,152,26,0.10)', border: '1px solid rgba(200,152,26,0.30)',
          color: '#a07828', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={14} />
          Published! Your public Dream Windows are now visible on ViewProfile.
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

