'use client';

import React from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';

/**
 * ProfileCustomizeButton — small client button that enters customize mode
 * for the profile page. Used in the server-rendered profile/[handle]/page.tsx.
 */
export default function ProfileCustomizeButton() {
  const { enterCustomizeMode } = useCustomizeMode();
  return (
    <button
      type="button"
      onClick={() => enterCustomizeMode('profile')}
      title="Customize profile"
      style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(58,111,216,0.12)',
        border: '1.5px solid rgba(58,111,216,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, color: '#3a6fd8', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(58,111,216,0.12)',
      }}
      aria-label="Customize profile appearance"
    >
      🎨
    </button>
  );
}
