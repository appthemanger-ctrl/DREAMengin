'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import HomeFeed from '@/components/HomeFeed';

type CoreFace = 'home' | 'profile';

type Props = {
  userId: string;
  face: CoreFace;
  isOpen: boolean;
  onToggleFace: () => void;
  onClose: () => void;
  onOpenDrEams: () => void;
  profile: {
    id?: string;
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    links?: unknown;
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
};

function ProfileFace({
  userId,
  profile,
  userPosts,
}: {
  userId: string;
  profile: Props['profile'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userPosts: any[];
}) {
  const supabase = createClient();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(() => ({
    display_name: profile?.display_name ?? '',
    bio: (profile as any)?.bio ?? '',
    // links: [{ platform, url }]
    links: Array.isArray((profile as any)?.links) ? (profile as any).links : [],
  }));

  React.useEffect(() => {
    setForm({
      display_name: profile?.display_name ?? '',
      bio: (profile as any)?.bio ?? '',
      links: Array.isArray((profile as any)?.links) ? (profile as any).links : [],
    });
  }, [profile?.display_name, (profile as any)?.bio, (profile as any)?.links]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        display_name: form.display_name || null,
        bio: form.bio || null,
        links: Array.isArray(form.links) ? form.links.filter((l: any) => l?.url) : [],
      };

      const { error: upErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (upErr) throw upErr;
      setEditing(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => setForm((p: any) => ({ ...p, links: [...(p.links || []), { platform: '', url: '' }] }));
  const updateLink = (idx: number, field: 'platform' | 'url', value: string) =>
    setForm((p: any) => {
      const next = [...(p.links || [])];
      next[idx] = { ...(next[idx] || { platform: '', url: '' }), [field]: value };
      return { ...p, links: next };
    });
  const removeLink = (idx: number) =>
    setForm((p: any) => ({ ...p, links: (p.links || []).filter((_: any, i: number) => i !== idx) }));

  return (
    <div style={{ padding: 22 }}>
      <div className="de-tag">Profile</div>
      <div className="de-label" style={{ fontSize: 24, marginTop: 6 }}>
        @{profile?.handle ?? 'user'}
      </div>
      <div style={{ marginTop: 6, color: 'var(--de-text-dim)', fontSize: 13 }}>
        {profile?.display_name ? profile.display_name : 'Set your display name to personalize your space.'}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="de-icon-btn"
          onClick={() => setEditing((p) => !p)}
          aria-label={editing ? 'Close editor' : 'Edit profile'}
          style={{ width: 'auto', padding: '10px 12px', borderRadius: 12 }}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
        {editing ? (
          <button
            type="button"
            className="de-icon-btn"
            onClick={save}
            disabled={saving}
            aria-label="Save profile"
            style={{ width: 'auto', padding: '10px 12px', borderRadius: 12, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>

      {error ? (
        <div
          className="de-glass"
          style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(239,68,68,.35)', color: '#fecaca' }}
        >
          {error}
        </div>
      ) : null}

      {editing ? (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <div className="de-widget-card" style={{ padding: 14 }}>
            <div className="de-tag">Display Name</div>
            <input
              value={form.display_name}
              onChange={(e) => setForm((p: any) => ({ ...p, display_name: e.target.value }))}
              placeholder="Your name"
              style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(8,22,72,0.35)', border: '1px solid var(--de-border)', color: 'var(--de-white)' }}
            />
          </div>

          <div className="de-widget-card" style={{ padding: 14 }}>
            <div className="de-tag">Bio</div>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p: any) => ({ ...p, bio: e.target.value }))}
              placeholder="A sentence or two about you"
              rows={3}
              style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(8,22,72,0.35)', border: '1px solid var(--de-border)', color: 'var(--de-white)', resize: 'none' }}
            />
          </div>

          <div className="de-widget-card" style={{ padding: 14 }}>
            <div className="de-tag">Links</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {(form.links || []).map((link: any, idx: number) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                  <input
                    value={link?.platform || ''}
                    onChange={(e) => updateLink(idx, 'platform', e.target.value)}
                    placeholder="Label"
                    style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(8,22,72,0.35)', border: '1px solid var(--de-border)', color: 'var(--de-white)' }}
                  />
                  <input
                    value={link?.url || ''}
                    onChange={(e) => updateLink(idx, 'url', e.target.value)}
                    placeholder="https://…"
                    style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(8,22,72,0.35)', border: '1px solid var(--de-border)', color: 'var(--de-white)' }}
                  />
                  <button
                    type="button"
                    className="de-icon-btn"
                    onClick={() => removeLink(idx)}
                    aria-label="Remove link"
                    style={{ width: 44, height: 44 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="de-icon-btn"
                style={{ width: 'auto', padding: '10px 12px', borderRadius: 12, justifySelf: 'start' }}
              >
                + Add link
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          {(profile as any)?.bio ? (
            <div className="de-widget-card" style={{ padding: 14 }}>
              <div className="de-tag">Bio</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--de-text)' }}>{(profile as any).bio}</div>
            </div>
          ) : null}

          {Array.isArray((profile as any)?.links) && (profile as any).links.length ? (
            <div className="de-widget-card" style={{ padding: 14, marginTop: 10 }}>
              <div className="de-tag">Links</div>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {(profile as any).links.map((l: any, idx: number) => (
                  <a
                    key={idx}
                    href={l?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="de-glass"
                    style={{ padding: '10px 12px', borderRadius: 12, color: '#93c5fd', border: '1px solid rgba(37,99,235,0.25)' }}
                  >
                    {l?.platform || l?.url}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div className="de-tag">Your posts</div>
        <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
          {userPosts.length ? (
            userPosts.slice(0, 6).map((p: any) => (
              <div key={p.id} className="de-widget-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--de-text)', whiteSpace: 'pre-wrap' }}>{p.content}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--de-text-dim)' }}>{new Date(p.created_at).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div className="de-widget-card" style={{ padding: 14, color: 'var(--de-text-dim)' }}>
              No posts yet. Flip back to Home and create your first post.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoreDream({ userId, face, isOpen, onToggleFace, onClose, onOpenDrEams, profile, initialPosts }: Props) {
  const flipped = face === 'profile';
  if (!isOpen) return null;

  const userHandle = profile?.handle ?? 'user';
  const userDisplayName = profile?.display_name ?? userHandle;
  const userAvatar = profile?.avatar_url ?? null;
  const userPosts = (initialPosts || []).filter((p: any) => p?.user_id === userId);

  return (
    <div style={{ width: 'min(84rem, 95vw)', pointerEvents: 'auto' }}>
      <div className="de-glass de-glass-blue" style={{ borderRadius: 30, overflow: 'hidden', minHeight: '78vh' }}>
        <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="de-tag">Core Dream</div>
            <div className="de-label" style={{ fontSize: 24 }}>{flipped ? 'Profile' : 'Home Feed'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="de-icon-btn" onClick={onToggleFace} aria-label="Toggle face">⟳</button>
            <button type="button" className="de-icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="de-divider de-divider-gold" />

        <div style={{ transformStyle: 'preserve-3d', transition: 'transform .5s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
          <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', padding: 14 }}>
            <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <HomeFeed
                embedded
                userId={userId}
                userHandle={userHandle}
                userAvatar={userAvatar}
                userDisplayName={userDisplayName}
                initialPosts={initialPosts as any}
              />
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <div style={{ maxHeight: '78vh', overflow: 'auto' }}>
              <ProfileFace userId={userId} profile={profile} userPosts={userPosts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
