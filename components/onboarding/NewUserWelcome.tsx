'use client';

import React, { useState } from 'react';
import FirstSignInExperience from './FirstSignInExperience';
import FirstSignInGridView from './FirstSignInGridView';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  profile?: ProfileLike | null;
  onComplete?: () => void;
};

/**
 * NewUserWelcome — Orchestrates the first sign-in experience
 * 
 * Shows two views that match the design specs:
 * 1. HomeDream view (IMG_5525) - Home/Feed with widget placeholders
 * 2. Grid view (IMG_5523) - Profile pill with blurred app grid
 * 
 * User can swipe or tap the gold button to proceed
 */
export default function NewUserWelcome({ profile, onComplete }: Props) {
  const [view, setView] = useState<'home' | 'grid'>('home');

  const handleNext = () => {
    if (view === 'home') {
      setView('grid');
    } else {
      onComplete?.();
    }
  };

  // Swipe handling for view transitions
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;

    // Horizontal swipe detection (more sensitive than vertical)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && view === 'home') {
        // Swipe left -> go to grid
        setView('grid');
      } else if (dx > 0 && view === 'grid') {
        // Swipe right -> go back to home
        setView('home');
      }
    }
    setTouchStart(null);
  };

  return (
    <div
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* View indicator dots */}
      <div
        style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: view === 'home' ? 'rgba(200,152,26,0.9)' : 'rgba(200,152,26,0.3)',
            transition: 'background 0.2s',
          }}
        />
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: view === 'grid' ? 'rgba(200,152,26,0.9)' : 'rgba(200,152,26,0.3)',
            transition: 'background 0.2s',
          }}
        />
      </div>

      {/* Animated view container */}
      <div
        style={{
          position: 'relative',
          width: '200%',
          height: '100%',
          display: 'flex',
          transform: view === 'home' ? 'translateX(0)' : 'translateX(-50%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ width: '50%', height: '100%', flexShrink: 0 }}>
          <FirstSignInExperience profile={profile} onComplete={handleNext} />
        </div>
        <div style={{ width: '50%', height: '100%', flexShrink: 0 }}>
          <FirstSignInGridView profile={profile} onComplete={handleNext} />
        </div>
      </div>
    </div>
  );
}
