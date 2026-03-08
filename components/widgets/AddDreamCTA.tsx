'use client';
// components/widgets/AddDreamCTA.tsx
// "Add a Dream" primary CTA for empty first layer (req 62-63)
//
// • Shown centred when layer is completely empty (req 62)
// • Becomes smaller / disappears after first widget is installed (req 63)

import React from 'react';

export interface AddDreamCTAProps {
  /** Whether any widgets have been installed yet */
  hasWidgets: boolean;
  /** Called when user taps the CTA */
  onOpenLibrary: () => void;
}

export default function AddDreamCTA({ hasWidgets, onOpenLibrary }: AddDreamCTAProps) {
  if (hasWidgets) return null; // req 63: disappear once space is alive

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 48,
        marginBottom: 12,
        filter: 'drop-shadow(0 4px 12px rgba(42,138,184,0.25))',
      }}>
        ✦
      </div>
      <h2 style={{
        fontSize: 20, fontWeight: 800,
        color: 'var(--de-heading)', marginBottom: 8,
      }}>
        Add a Dream
      </h2>
      <p style={{
        fontSize: 13, color: 'var(--de-text-dim)',
        lineHeight: 1.5, maxWidth: 240, marginBottom: 20,
      }}>
        Connect a service or pick a Dream to bring your space to life.
      </p>
      <button
        type="button"
        onClick={onOpenLibrary}
        style={{
          padding: '12px 28px', borderRadius: 14,
          background: 'var(--de-accent)', border: 'none',
          color: '#fff', fontSize: 14, fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(42,138,184,0.3)',
        }}
      >
        + Add Dream
      </button>
    </div>
  );
}
