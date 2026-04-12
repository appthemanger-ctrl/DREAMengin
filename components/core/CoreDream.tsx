'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import WorkspaceDashboard from '@/dreamdmbar/homedream/WorkspaceDashboard';

type CoreFace = 'home' | 'profile';

type Props = {
  face: CoreFace;
  isOpen: boolean;
  onToggleFace: () => void;
  onClose: () => void;
  onOpenDrEams: () => void;
  onOpenDreamSpace?: () => void;
  isAdmin?: boolean;
  profile: {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
   
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
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--de-heading)' }}>Dreamengin</span>
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
function HomeFace({ onOpenDrEams, onOpenDreamSpace, profile, posts, isAdmin }: {
  onOpenDrEams: () => void;
  onOpenDreamSpace?: () => void;
  profile: Props['profile'];
  isAdmin?: boolean;
   
  posts?: any[];
}) {
  return (
    <WorkspaceDashboard
      profile={profile}
      posts={posts ?? []}
      onOpenDrEams={onOpenDrEams}
      onOpenDreamSpace={onOpenDreamSpace}
      isAdmin={isAdmin}
    />
  );
}

/* ── Profile face ── */
function ProfileFace({ profile, onToggleFace }: { profile: Props['profile']; onToggleFace: () => void }) {
  const name   = profile?.display_name || 'Dreamer';
  const handle = profile?.handle || 'dreamer';

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onToggleFace}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--de-text-dim)', padding: '12px 0 8px',
          fontWeight: 600,
        }}
      >
        ← Home
      </button>

      {/* Avatar + info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
          border: '3px solid rgba(200,152,26,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 700, color: 'white',
        }}>
          {name[0]?.toUpperCase()}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--de-heading)' }}>{name}</div>
          <div style={{ fontSize: 14, color: 'var(--de-text-dim)' }}>@{handle}</div>
        </div>
        {/* Profile action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/edit-profiledream"
            style={{
              padding: '8px 22px', borderRadius: 100,
              background: 'linear-gradient(135deg, #c8981a, #e0b830)',
              color: 'white', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', display: 'inline-block',
              boxShadow: '0 2px 10px rgba(200,152,26,0.3)',
            }}
          >
            Edit Profile
          </Link>
          <Link
            href="/view-profile"
            style={{
              padding: '8px 22px', borderRadius: 100,
              background: 'rgba(160,195,240,0.2)',
              border: '1px solid rgba(160,195,240,0.4)',
              color: 'var(--de-heading)', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Photos',       value: '637'           },
          { label: 'Achievements', value: '23', badge: 23 },
          { label: 'Dream Goals',  value: '12', badge: 12 },
          { label: 'About Me',     value: 'Bio & Interests' },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'rgba(255,255,255,0.88)', borderRadius: 14,
            boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            textAlign: 'center', padding: '14px 8px', position: 'relative',
          }}>
            {item.badge !== undefined && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--de-gold)', color: 'white',
                fontSize: 10, fontWeight: 700, borderRadius: 100,
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.badge}
              </span>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Social widgets row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.88)', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>TikTok</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>NEW VIDEO! Exploring the World!</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 6 }}>218.7K views</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.88)', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>Music</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>Vlay Vibe - chill &amp; resonance</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 6 }}>4:38</div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'YouTube', value: '95k views'   },
          { label: 'Friends', value: '257'          },
          { label: 'Twitter', value: '#dreamingbig' },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'rgba(255,255,255,0.88)', borderRadius: 14,
            boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            textAlign: 'center', padding: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{item.label}</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── WallBanner (used in profile face only) ── */
function WallBanner() {
  const [wallImage, setWallImage] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('dreamengin:wall:image');
      return stored || null;
    } catch {
      return null;
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
export default function CoreDream({ face, isOpen, onToggleFace, onClose: _onClose, onOpenDrEams, onOpenDreamSpace, isAdmin, profile, posts }: Props) {
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
      <HomeFace onOpenDrEams={onOpenDrEams} onOpenDreamSpace={onOpenDreamSpace} profile={profile} posts={posts} isAdmin={isAdmin} />
    </div>
  );
}
