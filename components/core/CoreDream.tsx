'use client';

import React from 'react';
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

function ProfileFace({ profile }: { profile: Props['profile'] }) {
  return (
    <div style={{ padding: 22 }}>
      <div className="de-tag">Profile</div>
      <div className="de-label" style={{ fontSize: 24, marginTop: 6 }}>@{profile?.handle ?? 'user'}</div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        {['Photos', 'Achievements', 'Goals', 'Friends'].map((label) => (
          <div key={label} className="de-widget-card" style={{ minHeight: 120 }}>
            <div className="de-tag">{label}</div>
          </div>
        ))}
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
            <HomeFeedWidgetGrid onOpenDrEams={onOpenDrEams} />
          </div>
          <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <ProfileFace profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}
