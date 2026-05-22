'use client';

import HomeDreamSurface from '@/app/dreamdmbar/_components/HomeDreamRegion';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

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
   
  posts?: Post[];
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

/* ── Feed post card ── */

/* ── Recent Activity agent card ── */

/* ── Key Metrics cards ── */

/* ── Home face — delegates to HomeDreamSurface ── */
function HomeFace({ onOpenDrEams, onOpenDreamSpace, profile, posts, isAdmin }: { onOpenDrEams: () => void; onOpenDreamSpace?: () => void; profile: Props['profile']; isAdmin?: boolean; posts?: Post[] }) {
  return (
    <HomeDreamSurface
      profile={profile}
      posts={posts ?? []}
      onOpenDrEams={onOpenDrEams}
      onOpenDreamSpace={onOpenDreamSpace}
      isAdmin={isAdmin}
    />
  );
}

/* ── Profile face ── */
function ProfileFace({ profile, onToggleFace }: {profile: Props['profile']; onToggleFace: () => void}) {
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
function WallBanner( ){
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
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const url = (ev.target as FileReader).result as string;
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

  // Home face — HomeDreamSurface is full-screen, owns its own header + layout
  return (
    <div style={{ width: '100%', minHeight: '100svh' }}>
      <HomeFace onOpenDrEams={onOpenDrEams} onOpenDreamSpace={onOpenDreamSpace} profile={profile} posts={posts} isAdmin={isAdmin} />
    </div>
  );
}
