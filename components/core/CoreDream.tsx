'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import WorkspaceDashboard from '@/components/home/WorkspaceDashboard';

type CoreFace = 'home' | 'profile';

type Props = {
  face: CoreFace;
  isOpen: boolean;
  onToggleFace: () => void;
  onClose: () => void;
  onOpenDrEams: () => void;
  profile: {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts?: any[];
};

/* ── Recent activity agent definitions ── */
const RECENT_AGENTS = [
  {
    id: 'dr-eams',
    name: 'Dr. Eams',
    initial: 'A',
    bg: '#4A90D9',
    iconColor: '#fff',
    time1: '11:50 Pm',
    time2: '03:40 pm',
  },
  {
    id: 'idari',
    name: 'IDARi',
    initial: '⬡',
    bg: '#1a1a1a',
    iconColor: '#c8981a',
    time1: '1:50 Pm',
    time2: '02:30 pm',
  },
  {
    id: 'boogieman',
    name: 'TheBoogieMan',
    initial: '👁',
    bg: '#2d1a4a',
    iconColor: '#fff',
    time1: '1:30 Pm',
    time2: '0:30 pm',
  },
] as const;

/* ── Shared section header row ── */
function SectionHeader({ title, badge }: { title: string; badge?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--de-heading)' }}>{title}</span>
      {badge !== undefined && (
        <span style={{
          background: 'rgba(230,220,200,0.85)',
          color: 'var(--de-heading)',
          borderRadius: 100,
          padding: '2px 12px',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ── Feed post card ── */
function PostCard() {
  const [liked, setLiked] = useState(false);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.94)',
      borderRadius: 20,
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      overflow: 'hidden',
      marginBottom: 4,
    }}>
      {/* Post header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a8ab8, #c8981a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'white', fontWeight: 700, flexShrink: 0,
          }}>D</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--de-heading)' }}>DREAMengin</span>
        </div>
        <span style={{ color: 'var(--de-text-dim)', fontSize: 18, letterSpacing: 3, lineHeight: 1 }}>···</span>
      </div>

      {/* Post image */}
      <div style={{
        height: 140,
        background: 'linear-gradient(135deg, #b8d4e8 0%, #c5daf0 50%, #d8e8f5 100%)',
        margin: '0 12px',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 38, opacity: 0.35 }}>🏗️</span>
      </div>

      {/* Post actions */}
      <div style={{ padding: '2px 16px 14px', display: 'flex', gap: 22 }}>
        {([
          { icon: liked ? '♥' : '♡', label: 'Like',    action: () => setLiked((v) => !v) },
          { icon: '💬',               label: 'Comment', action: undefined },
          { icon: '↗',               label: 'Share',   action: undefined },
        ] as const).map(({ icon, label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, color: liked && label === 'Like' ? '#e54' : 'var(--de-text-dim)',
              fontWeight: 500, padding: 0,
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Recent Activity agent card ── */
function AgentCard({ agent }: { agent: typeof RECENT_AGENTS[number] }) {
  return (
    <div style={{
      minWidth: 148,
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.92)',
      borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: agent.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: agent.id === 'dr-eams' ? 14 : 15,
          fontWeight: 700,
          color: agent.iconColor,
          flexShrink: 0,
        }}>
          {agent.initial}
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 88 }}>
          {agent.name}
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)', marginBottom: 2 }}>{agent.time1}</div>
      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{agent.time2}</div>
    </div>
  );
}

/* ── Key Metrics cards ── */
function MetricsRow() {
  const cards = [
    {
      id: 'eams',
      rows: [
        { icon: '👤', label: 'Eams' },
        { icon: '✦', label: 'Valhzdrd' },
      ],
      minWidth: 150,
    },
    {
      id: 'ean',
      rows: [
        { icon: '✏️', label: 'Ean' },
        { icon: '✦', label: '3065' },
      ],
      minWidth: 100,
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
      {cards.map((card) => (
        <div key={card.id} style={{
          minWidth: card.minWidth,
          padding: '14px 16px',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}>
          {card.rows.map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(220,235,250,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, flexShrink: 0,
              }}>{row.icon}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{row.label}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Bar-chart card */}
      <div style={{
        minWidth: 96,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', marginBottom: 10, display: 'block' }}>Tams</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
          {[0.45, 0.75, 0.5, 1, 0.65].map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 3,
              height: `${h * 100}%`,
              background: `rgba(42,138,184,${0.35 + h * 0.45})`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Home face — delegates to WorkspaceDashboard ── */
function HomeFace({ onOpenDrEams, profile, posts, onFlipToProfile }: {
  onOpenDrEams: () => void;
  profile: Props['profile'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts?: any[];
  onFlipToProfile?: () => void;
}) {
  return (
    <WorkspaceDashboard
      profile={profile}
      posts={posts ?? []}
      onOpenDrEams={onOpenDrEams}
      onFlipToProfile={onFlipToProfile}
    />
  );
}

/* ── Profile face — Mockup 2: avatar hero card + connected app tiles grid ── */
const PROFILE_APP_TILES = [
  { label: 'TikTok',    emoji: '🎵', color: '#010101' },
  { label: 'Music',     emoji: '🎶', color: '#1DB954' },
  { label: 'Spotify',   emoji: '🎧', color: '#1DB954' },
  { label: 'Instagram', emoji: '📷', color: '#e1306c' },
  { label: 'YouTube',   emoji: '▶️', color: '#FF0000' },
  { label: 'Twitter',   emoji: '🐦', color: '#1da1f2' },
  { label: 'LinkedIn',  emoji: '💼', color: '#0077b5' },
  { label: 'Messages',  emoji: '💬', color: '#25D366' },
  { label: 'Snapchat',  emoji: '👻', color: '#FFFC00' },
] as const;

function ProfileFace({ profile, onToggleFace }: { profile: Props['profile']; onToggleFace: () => void }) {
  const name    = profile?.display_name || 'Dreamer';
  const handle  = profile?.handle || 'dreamer';
  const avatarUrl = profile?.avatar_url;

  return (
    <div style={{ padding: '0 0 24px' }}>

      {/* ── Avatar hero card ── */}
      <div style={{
        background: 'rgba(255,255,255,0.68)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        {/* Banner area */}
        <div style={{
          height: 80,
          background: 'linear-gradient(135deg, var(--de-bg-start), var(--de-bg-mid), var(--de-bg-end))',
        }} />

        {/* Avatar + info + chevron row */}
        <div style={{ padding: '0 16px 16px', position: 'relative', marginTop: -36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            {/* Large avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              border: '3px solid rgba(200,152,26,0.45)',
              background: avatarUrl ? undefined : 'linear-gradient(135deg, #c8981a, #4A9ED6)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            }}>
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name[0]?.toUpperCase()}
            </div>

            {/* Name + handle */}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>@{handle}</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 1 }}>24,981 Followers</div>
            </div>

            {/* Chevron — flip back to home */}
            <button
              type="button"
              onClick={onToggleFace}
              style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(200,152,26,0.12)',
                border: '1px solid rgba(200,152,26,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18, color: '#c8981a',
                alignSelf: 'center',
              }}
              aria-label="Flip to home"
            >
              ›
            </button>
          </div>

          {/* Spec-first navigation shortcuts */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Link href="/edit-profiledream" style={{
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(200,152,26,0.12)',
              border: '1px solid rgba(200,152,26,0.3)',
              color: '#c8981a', fontSize: 11, fontWeight: 700,
              textDecoration: 'none',
            }}>
              ✎ Edit ProfileDream
            </Link>
            <Link href={handle ? `/profile/${handle}` : '/view-profile'} style={{
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(42,138,184,0.10)',
              border: '1px solid rgba(42,138,184,0.25)',
              color: 'var(--de-accent)', fontSize: 11, fontWeight: 700,
              textDecoration: 'none',
            }}>
              👁 ViewProfile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Connected app tiles — 3-column iOS grid (Mockup 2) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.80)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
        padding: '16px 14px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 12 }}>
          Connected Apps
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {PROFILE_APP_TILES.map(app => (
            <div key={app.label} style={{
              background: 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(12px)',
              borderRadius: 18, padding: '14px 8px',
              border: '1px solid rgba(255,255,255,0.90)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              cursor: 'pointer',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: `${app.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {app.emoji}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-heading)', textAlign: 'center' }}>
                {app.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── WallBanner (used in profile face only) ── */
function WallBanner() {
  const [wallImage, setWallImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dreamengin:wall:image');
      if (stored) setWallImage(stored);
    } catch { /* noop */ }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setWallImage(url);
      try { localStorage.setItem('dreamengin:wall:image', url); } catch { /* noop */ }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ height: 90, overflow: 'hidden', position: 'relative', borderRadius: '16px 16px 0 0', marginBottom: 12 }}>
      {wallImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wallImage} alt="Wall" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--de-bg-start), var(--de-bg-mid), var(--de-bg-end))' }} />
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)', border: 'none',
          color: 'white', fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Edit wall image"
      >
        ✏️
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

/* ── Main export ── */
export default function CoreDream({ face, isOpen, onToggleFace, onClose: _onClose, onOpenDrEams, profile, posts }: Props) {
  if (!isOpen) return null;

  if (face === 'profile') {
    return (
      <div style={{
        width: '100%',
        padding: '0 18px',
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 24,
        border: '1px solid rgba(160,195,240,0.4)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <WallBanner />
        <ProfileFace profile={profile} onToggleFace={onToggleFace} />
      </div>
    );
  }

  // Home face — WorkspaceDashboard is full-screen, owns its own header + layout
  return (
    <div style={{ width: '100%', minHeight: '100svh' }}>
      <HomeFace onOpenDrEams={onOpenDrEams} profile={profile} posts={posts} onFlipToProfile={onToggleFace} />
    </div>
  );
}
