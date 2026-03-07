'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  Eye, Share2, Check, Pencil, X, Save, 
  Music, ShoppingBag, FileText, Users, Image as ImageIcon,
  Globe, BarChart3, Gamepad2
} from 'lucide-react';
import PlatformBadge from '@/components/ui/PlatformBadge';

type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
};

type WidgetSlot = {
  id: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
};

const WIDGET_SLOTS: WidgetSlot[] = [
  { id: 'music',       icon: Music,       label: 'Music',        desc: 'Your releases & playlists',  color: '#2a8ab8' },
  { id: 'shop',        icon: ShoppingBag, label: 'Shop',         desc: 'Your products & listings',   color: '#c8981a' },
  { id: 'posts',       icon: FileText,    label: 'Posts',        desc: 'Recent updates & thoughts',  color: '#3b7dd8' },
  { id: 'connections', icon: Users,       label: 'Connections',  desc: 'Your top follows',           color: '#22c55e' },
  { id: 'media',       icon: ImageIcon,   label: 'Asset Library',  desc: 'Photos & videos you share',  color: '#ec4899' },
  { id: 'analytics',   icon: BarChart3,   label: 'Performance Signals',  desc: 'Public reach numbers',       color: '#f59e0b' },
  { id: 'games',       icon: Gamepad2,    label: 'Game Scores',  desc: 'Dr. Eams high scores',       color: '#ef4444' },
  { id: 'site',        icon: Globe,       label: 'Website',      desc: 'Your link in bio',           color: '#0ea5e9' },
];

function loadVisibility(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('de-profile-widgets') || '{}'); }
  catch { return {}; }
}
function saveVisibility(v: Record<string, boolean>) {
  localStorage.setItem('de-profile-widgets', JSON.stringify(v));
}

export default function ProfileCanvas({ initialProfile }: { initialProfile: Profile }) {
  const supabase = createClient();
  const [profile, setProfile]       = useState(initialProfile);
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState({
    display_name: initialProfile.display_name || '',
    bio:          initialProfile.bio          || '',
    location:     initialProfile.location     || '',
    website:      initialProfile.website      || '',
  });
  const [saving, setSaving]         = useState(false);
  const [saveErr, setSaveErr]       = useState('');
  const [saved, setSaved]           = useState(false);
  const [copied, setCopied]         = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(loadVisibility);

  const handle      = profile.handle;
  const displayName = profile.display_name || handle;

  /* ── Save edits ── */
  const saveEdits = useCallback(async () => {
    setSaving(true); setSaveErr('');
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: draft.display_name || null,
        bio:          draft.bio          || null,
        location:     draft.location     || null,
        website:      draft.website      || null,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) { setSaveErr(error.message); return; }
    setProfile(p => ({ ...p, ...draft }));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [draft, profile.id, supabase]);

  /* ── Toggle widget visibility ── */
  const toggleWidget = useCallback((id: string) => {
    setVisibility(prev => {
      const next = { ...prev, [id]: !(prev[id] !== false) };
      saveVisibility(next);
      return next;
    });
  }, []);

  /* ── Copy share link ── */
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`https://dreamengin.app/u/${handle}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [handle]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Profile Card — inline editable MySpace-style ── */}
      <div className="de-widget" style={{
        background: 'linear-gradient(160deg, rgba(200,152,26,0.06) 0%, rgba(42,138,184,0.06) 100%)',
        borderColor: 'rgba(42,138,184,0.22)',
        overflow: 'hidden',
      }}>
        {/* Gradient banner strip */}
        <div style={{
          height: 72,
          background: 'linear-gradient(135deg, var(--de-theme-from, #c8dff5) 0%, var(--de-theme-mid, #d8eaf8) 50%, var(--de-theme-to, #f5e8c4) 100%)',
          position: 'relative',
        }}>
          {/* Avatar */}
          <div style={{ position: 'absolute', bottom: -30, left: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: profile.avatar_url
                ? undefined
                : 'linear-gradient(135deg, var(--de-accent), var(--de-gold))',
              backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
              border: '3px solid rgba(255,255,255,0.92)',
              boxShadow: '0 3px 14px rgba(0,0,0,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, color: '#fff', fontWeight: 700, flexShrink: 0,
            }}>
              {!profile.avatar_url && (displayName[0] || '∞').toUpperCase()}
            </div>
          </div>
          {/* Visitor View shortcut */}
          <div style={{ position: 'absolute', top: 8, right: 10 }}>
            <Link
              href={`/profile/${handle}`}
              target="_blank"
              className="de-btn"
              style={{ fontSize: 11, padding: '5px 10px', gap: 4, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', color: 'var(--de-heading)' }}
            >
              <Eye className="w-3 h-3" /> Visitor View
            </Link>
          </div>
        </div>

        <div className="de-widget-body" style={{ paddingTop: 38 }}>
          {!editing ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)' }}>{displayName}</div>
                  <div style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 1 }}>@{handle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ display_name: profile.display_name||'', bio: profile.bio||'', location: profile.location||'', website: profile.website||'' });
                    setEditing(true);
                  }}
                  className="de-btn de-btn-ghost"
                  style={{ fontSize: 11, padding: '5px 10px', gap: 4, flexShrink: 0 }}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>

              {profile.bio ? (
                <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.6, marginTop: 10 }}>{profile.bio}</p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 10, fontStyle: 'italic' }}>
                  No bio yet — tap Edit to tell the world what you dream.
                </p>
              )}

              <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                {profile.location && <span style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>📍 {profile.location}</span>}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--de-accent)', textDecoration: 'none' }}>
                    🔗 {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              {saved && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check className="w-3 h-3" /> Profile saved
                </div>
              )}
            </div>
          ) : (
            /* Edit mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Editing Profile
                </span>
                <button type="button" onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
                </button>
              </div>

              {([
                { key: 'display_name', label: 'Name',     placeholder: 'Your name',              multiline: false },
                { key: 'bio',          label: 'Bio',      placeholder: 'What do you dream about?', multiline: true  },
                { key: 'location',     label: 'Location', placeholder: 'City, State',             multiline: false },
                { key: 'website',      label: 'Website',  placeholder: 'https://',               multiline: false },
              ] as const).map(({ key, label, placeholder, multiline }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    {label}
                  </label>
                  {multiline ? (
                    <textarea
                      value={draft[key]}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      rows={3}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(42,138,184,0.25)', color: 'var(--de-text)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft[key]}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(42,138,184,0.25)', color: 'var(--de-text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              ))}

              {saveErr && <div style={{ fontSize: 12, color: '#dc4444' }}>{saveErr}</div>}
              <button type="button" onClick={saveEdits} disabled={saving} className="de-btn de-btn-primary" style={{ gap: 6 }}>
                {saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save Profile</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Widget Canvas — pick what visitors see ── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">Profile Canvas</span>
          <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Toggle what visitors see</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {WIDGET_SLOTS.map(({ id, icon: Icon, label, desc, color }) => {
              const on = visibility[id] !== false;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleWidget(id)}
                  style={{
                    borderRadius: 14, padding: 12, textAlign: 'left', cursor: 'pointer',
                    background: on ? 'rgba(255,255,255,0.65)' : 'rgba(160,195,240,0.06)',
                    border: on ? `1.5px solid ${color}55` : '1.5px solid rgba(160,195,240,0.2)',
                    transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: 6,
                    opacity: on ? 1 : 0.52,
                  }}
                  aria-pressed={on}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Icon className="w-4 h-4" style={{ color: on ? color : 'var(--de-text-dim)' }} />
                    {/* Mini toggle */}
                    <div style={{ width: 28, height: 16, borderRadius: 99, background: on ? color : 'rgba(160,195,240,0.3)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.18s' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.3 }}>{desc}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="de-widget-actions">
          <Link href={`/profile/${handle}`} target="_blank" className="de-btn de-btn-primary text-xs" style={{ gap: 5 }}>
            <Eye className="w-3 h-3" /> See What Visitors See
          </Link>
        </div>
      </div>

      {/* ── Share Profile ── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Share2 className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
          <span className="de-widget-title">Share Your Profile</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(160,195,240,0.3)' }}>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--de-text)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              dreamengin.app/u/{handle}
            </span>
            <button type="button" onClick={copyLink} className="de-btn de-btn-ghost" style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0, gap: 4 }}>
              {copied ? <><Check className="w-3 h-3" /> Copied!</> : 'Copy'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(160,195,240,0.18)', flexWrap: 'wrap' }}>
            {['twitter','instagram','facebook','linkedin','whatsapp'].map(name => (
              <PlatformBadge key={name} name={name} size={36} label={name[0].toUpperCase() + name.slice(1)} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
