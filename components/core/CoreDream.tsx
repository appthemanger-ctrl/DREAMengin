'use client';

import React from 'react';
import HomeFeed from '@/components/HomeFeed';

type CoreFace = 'home' | 'profile';

type Props = {
  face: CoreFace;
  isOpen: boolean;
  onToggleFace: () => void;
  onClose: () => void;
  profile: {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
};

const QUICK_TILES = [
  { icon: '🎵', label: 'Music',  tag: 'Studio'   },
  { icon: '🔬', label: 'Lab',    tag: 'Research'  },
  { icon: '💻', label: 'Code',   tag: 'Editor'    },
  { icon: '✦',  label: 'Brand',  tag: 'Studio'    },
  { icon: '🎮', label: 'Games',  tag: 'Gaming'    },
  { icon: '⬡',  label: 'Create', tag: 'Create'    },
  { icon: '💬', label: 'Chat',   tag: 'Messages'  },
  { icon: '🗂',  label: 'Files',  tag: 'Vault'     },
];

function QuickTile({ icon, label, tag }: { icon: string; label: string; tag: string }) {
  return (
    <div className="de-widget-tile" style={{ minHeight: '68px', padding: '10px', cursor: 'pointer' }}>
      <div className="de-tag">{tag}</div>
      <div style={{ fontSize: '20px', marginTop: '3px' }}>{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--de-text)' }}>{label}</div>
    </div>
  );
}

function ProfileFace({ profile, onFlip }: { profile: Props['profile']; onFlip: () => void }) {
  return (
    <div style={{ padding: '20px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="de-tag">Profile</div>
          <div className="de-label" style={{ fontSize: '20px', marginTop: '3px' }}>
            @{profile?.handle ?? 'user_handle'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--de-text-dim)', marginTop: '2px' }}>24,981 followers</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            border: '2px solid var(--de-gold-dim)',
            background: 'linear-gradient(135deg,var(--de-blue),var(--de-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700, color: 'var(--de-gold)',
          }}>
            {(profile?.display_name ?? profile?.handle ?? 'U').charAt(0).toUpperCase()}
          </div>
          <button type="button" className="de-icon-btn"
            style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '12px' }}
            onClick={onFlip} title="Flip to Feed" aria-label="Flip to Feed">⟳</button>
        </div>
      </div>
      <div className="de-divider de-divider-gold" style={{ marginBottom: '14px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div className="de-widget-tile">
          <div className="de-tag">📸 Photos</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)', marginTop: '3px' }}>637 photos</div>
        </div>
        <div className="de-widget-tile">
          <div className="de-tag">🏆 Achievements</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-gold)', marginTop: '3px' }}>23 unlocked</div>
        </div>
        <div className="de-widget-tile">
          <div className="de-tag">✦ Dream Goals</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)', marginTop: '3px' }}>12 active · 6 done</div>
        </div>
        <div className="de-widget-tile">
          <div className="de-tag">👤 About Me</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)', marginTop: '3px' }}>Bio &amp; interests</div>
        </div>
        <div className="de-widget-tile" style={{ gridColumn: 'span 2' }}>
          <div className="de-tag" style={{ marginBottom: '4px' }}>🎵 Now Playing</div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--de-white)', marginBottom: '4px' }}>By Design — Kid Cudi</div>
          <div style={{ height: '3px', background: 'var(--de-border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div className="de-track-fill" style={{ width: '42%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--de-text-dim)', marginTop: '2px' }}>
            <span>1:23</span><span>5:38</span>
          </div>
        </div>
        <div className="de-widget-tile">
          <div className="de-tag">TikTok</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)', marginTop: '3px' }}>218.7k views</div>
          <div style={{ fontSize: '10px', color: 'var(--de-text-dim)', marginTop: '2px' }}>"Exploring the World!"</div>
        </div>
        <div className="de-widget-tile">
          <div className="de-tag">Friends</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)', marginTop: '3px' }}>257 friends</div>
          <div style={{ fontSize: '10px', color: 'var(--de-text-dim)', marginTop: '2px' }}>Sarah · Ben · Chloe +32</div>
        </div>
      </div>
    </div>
  );
}

export default function CoreDream({ face, isOpen, onToggleFace, onClose, profile, userId, initialPosts }: Props) {
  const flipped = face === 'profile';
  if (!isOpen) return null;

  return (
    <div style={{ width: 'min(46rem, 92vw)', pointerEvents: 'auto' }}>
      {/* Top 4 quick tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '10px' }}>
        {QUICK_TILES.slice(0, 4).map((t) => <QuickTile key={t.label} {...t} />)}
      </div>

      {/* Flip card */}
      <div className="de-glass de-glass-blue" style={{ borderRadius: '28px', overflow: 'hidden', perspective: '1100px' }}>
        {/* Top bar */}
        <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="de-tag">Dream Feed</div>
            <div className="de-label" style={{ fontSize: '20px', marginTop: '2px' }}>{flipped ? 'Profile' : 'Home'}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="de-badge">✦ Live</span>
            <button type="button" className="de-icon-btn" onClick={onToggleFace}
              title={flipped ? 'Flip to Feed' : 'Flip to Profile'} aria-label="Toggle face">⟳</button>
            <button type="button" className="de-icon-btn" onClick={onClose}
              title="Close Core Dream" aria-label="Close">✕</button>
          </div>
        </div>
        <div className="de-divider de-divider-gold" />

        {/* Flip inner */}
        <div style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
        }}>
          {/* FRONT */}
          <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as React.CSSProperties['WebkitBackfaceVisibility'] }}>
            <div style={{ maxHeight: 'min(56vh, 520px)', overflowY: 'auto', overflowX: 'hidden' }}>
              <HomeFeed embedded userId={userId}
                userHandle={profile?.handle ?? 'user'}
                userAvatar={profile?.avatar_url ?? null}
                userDisplayName={profile?.display_name ?? 'User'}
                initialPosts={initialPosts} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '10px', color: 'var(--de-text-dim)', letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '8px 0 12px' }}>
              <span>·</span> Swipe to navigate · Double-tap controls for menus <span>·</span>
            </div>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%',
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as React.CSSProperties['WebkitBackfaceVisibility'],
            transform: 'rotateY(180deg)',
          }}>
            <ProfileFace profile={profile} onFlip={onToggleFace} />
          </div>
        </div>
      </div>

      {/* Bottom 4 quick tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginTop: '10px' }}>
        {QUICK_TILES.slice(4).map((t) => <QuickTile key={t.label} {...t} />)}
      </div>
    </div>
  );
}
