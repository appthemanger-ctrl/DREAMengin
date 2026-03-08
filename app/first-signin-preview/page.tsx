'use client';

import { useState } from 'react';
import FirstSignInExperience from '@/components/onboarding/FirstSignInExperience';
import FirstSignInGridView from '@/components/onboarding/FirstSignInGridView';

/**
 * Preview page to demonstrate both first sign-in views
 * Access at /first-signin-preview
 */
export default function FirstSignInPreviewPage() {
  const [view, setView] = useState<'home' | 'grid'>('home');

  const mockProfile = {
    id: 'preview-user',
    handle: 'dreamer',
    display_name: 'New Dreamer',
    avatar_url: null,
  };

  return (
    <div className="min-h-screen">
      {/* View toggle */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100,
          display: 'flex',
          gap: 8,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          padding: '8px 12px',
          borderRadius: 100,
        }}
      >
        <button
          type="button"
          onClick={() => setView('home')}
          style={{
            padding: '6px 14px',
            borderRadius: 100,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            background: view === 'home' ? '#c8981a' : 'rgba(255,255,255,0.15)',
            color: view === 'home' ? '#fff' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.15s',
          }}
        >
          HomeDream View
        </button>
        <button
          type="button"
          onClick={() => setView('grid')}
          style={{
            padding: '6px 14px',
            borderRadius: 100,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            background: view === 'grid' ? '#c8981a' : 'rgba(255,255,255,0.15)',
            color: view === 'grid' ? '#fff' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.15s',
          }}
        >
          Grid View
        </button>
      </div>

      {/* View content */}
      {view === 'home' ? (
        <FirstSignInExperience
          profile={mockProfile}
          onComplete={() => setView('grid')}
        />
      ) : (
        <FirstSignInGridView
          profile={mockProfile}
          onComplete={() => alert('Onboarding complete!')}
        />
      )}
    </div>
  );
}
