'use client';

import React from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';

/**
 * CustomizeModeBar — fixed top banner shown when customize mode is active.
 * Matches the "CUSTOMIZE MODE | Done" design from the product spec.
 */
export default function CustomizeModeBar() {
  const { isCustomizeMode, activePage, exitCustomizeMode, saveSkin } = useCustomizeMode();

  if (!isCustomizeMode) return null;

  const pageLabel = activePage
    ? ({ home: 'Home', profile: 'Profile', dreamspace: 'DreamSpace', feed: 'Feed', global: 'All Pages' } as const)[activePage] ?? activePage
    : '';

  return (
    <div
      role="banner"
      aria-label="Customize mode active"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        background: 'linear-gradient(90deg, #3a6fd8 0%, #6a4ed8 100%)',
        boxShadow: '0 2px 16px rgba(58,111,216,0.4)',
      }}
    >
      {/* Cancel */}
      <button
        type="button"
        onClick={exitCustomizeMode}
        aria-label="Cancel customization"
        style={{
          background: 'rgba(255,255,255,0.18)',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          padding: '6px 14px',
          cursor: 'pointer',
          minWidth: 60,
          letterSpacing: '0.01em',
        }}
      >
        Cancel
      </button>

      {/* Title */}
      <div style={{
        color: '#fff',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        Customize {pageLabel}
      </div>

      {/* Done */}
      <button
        type="button"
        onClick={saveSkin}
        aria-label="Save customization"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: 'none',
          borderRadius: 8,
          color: '#3a6fd8',
          fontSize: 14,
          fontWeight: 700,
          padding: '6px 16px',
          cursor: 'pointer',
          minWidth: 60,
        }}
      >
        Done
      </button>
    </div>
  );
}
