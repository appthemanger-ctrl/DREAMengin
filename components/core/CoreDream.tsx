'use client';

import React, { useState, useRef, useEffect } from 'react';
import HomeFeedWidgetGrid from '@/components/dreamnav/HomeFeedWidgetGrid';

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
};

/* ── WallBanner ── */
function WallBanner() {
  const [wallImage, setWallImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('dreamengin:wall:image');
    if (stored) setWallImage(stored);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setWallImage(url);
      localStorage.setItem('dreamengin:wall:image', url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ height: 96, overflow: 'hidden', position: 'relative' }}>
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
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)', border: 'none',
          color: 'white', fontSize: 13, cursor: 'pointer',
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

/* ── Profile Face ── */
function ProfileFace({ profile }: { profile: Props['profile'] }) {
  const name = profile?.display_name || 'Dreamer';
  const handle = profile?.handle || 'dreamer';

  return (
    <div style={{ padding: 22, color: 'var(--de-text)' }}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3" style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
            border: '3px solid var(--de-border-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: 'white',
          }}
        >
          {name[0]?.toUpperCase()}
        </div>
        <div className="text-center">
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--de-heading)' }}>{name}</div>
          <div style={{ fontSize: 14, color: 'var(--de-text-dim)' }}>@{handle}</div>
          <div style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 4 }}>24,981 Followers</div>
        </div>
        <button
          type="button"
          style={{
            padding: '8px 28px', borderRadius: 100,
            background: 'var(--de-heading)', color: 'white',
            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          Follow
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: 'camera', label: 'Photos', value: '637 Photos' },
          { icon: 'trophy', label: 'Achievements', value: '23', badge: 23 },
          { icon: 'goals', label: 'Dream Goals', value: '12', badge: 12 },
          { icon: 'about', label: 'About Me', value: 'Bio & Interests', badge: 13 },
        ].map((item) => (
          <div key={item.label} className="de-widget-tile" style={{ textAlign: 'center', padding: '14px 8px', position: 'relative' }}>
            {item.badge && (
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
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>TikTok</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>
            NEW VIDEO! Exploring the World!
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 6 }}>218.7K views</div>
        </div>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>Music</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>
            Vlay Vibe - chill & resonance
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 6 }}>4:38</div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="de-widget-tile" style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>YouTube</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>95k views</div>
        </div>
        <div className="de-widget-tile" style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>Friends</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>257</div>
        </div>
        <div className="de-widget-tile" style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>Twitter</div>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>#dreamingbig</div>
        </div>
      </div>
    </div>
  );
}

export default function CoreDream({ face, isOpen, onToggleFace, onClose, onOpenDrEams, profile }: Props) {
  const flipped = face === 'profile';
  if (!isOpen) return null;

  return (
    <div style={{ width: 'min(84rem, 95vw)', pointerEvents: 'auto' }}>
      <div className="de-glass de-glass-blue" style={{ borderRadius: 30, overflow: 'hidden', minHeight: '78vh' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo1.PNG"
              alt="DREAMengin logo"
              width={40}
              height={40}
              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>
                {flipped ? 'Profile' : 'Dream Library'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--de-heading)', marginTop: 2 }}>
                {flipped ? (profile?.display_name || 'Profile') : 'DREAMengin'}
              </div>
              {!flipped && (
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - recent activity
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="de-icon-btn" onClick={onToggleFace} aria-label="Toggle face" style={{ color: 'var(--de-text)' }}>
              {flipped ? 'Home' : 'Profile'}
            </button>
            <button type="button" className="de-icon-btn" onClick={onClose} aria-label="Close" style={{ color: 'var(--de-text)' }}>
              x
            </button>
          </div>
        </div>
        <div className="de-divider de-divider-gold" />

        <WallBanner />

        {/* Content — plain conditional render, no 3D flip */}
        <div style={{ padding: 14 }}>
          {flipped ? <ProfileFace profile={profile} /> : <HomeFeedWidgetGrid onOpenDrEams={onOpenDrEams} />}
        </div>

        {/* Bottom DREAMengin logo */}
        <div className="flex justify-center" style={{ padding: '16px 0 20px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo1.PNG"
            alt="DREAMengin"
            width={52}
            height={52}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </div>
  );
}
