'use client';
// components/widgets/WidgetPlaceholder.tsx
// Empty slot placeholder (req 64-70)
//
// • Big plus icon + "Add" label (req 65)
// • Opens Widget Library on tap (req 66)
// • Premium look — not a blank rectangle (req 64)
// • Does not appear in public profile unless user publishes it (req 68)
//   (parent must pass isPublicView and not render this component if true)
// • Does not block navigation or scroll (req 69-70) — pointer-events only on card
// • Can be removed in Edit Layout (req 67) — parent passes onRemove

import React from 'react';

export interface WidgetPlaceholderProps {
  /** Called when user taps the placeholder — should open Widget Library (req 66) */
  onOpenLibrary: () => void;
  /** Called when user removes placeholder in Edit Layout (req 67) */
  onRemove?: () => void;
  /** Whether the layout is in edit mode (shows remove button) */
  isEditing?: boolean;
  /** Slot index, used as aria-label */
  slot?: number;
  style?: React.CSSProperties;
}

export default function WidgetPlaceholder({
  onOpenLibrary,
  onRemove,
  isEditing,
  slot,
  style,
}: WidgetPlaceholderProps) {
  return (
    <div
      style={{
        position: 'relative',
        // Placeholder must NOT block scroll — no fixed/sticky that intercepts events (req 70)
        ...style,
      }}
    >
      <button
        type="button"
        aria-label={slot !== undefined ? `Add widget to slot ${slot + 1}` : 'Add widget'}
        onClick={onOpenLibrary}
        style={{
          width: '100%',
          minHeight: 120,
          borderRadius: 18,
          border: '2px dashed rgba(42,138,184,0.35)',
          background: 'rgba(42,138,184,0.04)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 150ms ease, border-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,138,184,0.08)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(42,138,184,0.55)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,138,184,0.04)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(42,138,184,0.35)';
        }}
      >
        {/* Big plus icon (req 65) */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(42,138,184,0.10)',
          border: '1.5px solid rgba(42,138,184,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'var(--de-accent)',
          fontWeight: 300,
        }}>
          +
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-accent)' }}>Add</span>
      </button>

      {/* Remove in Edit Layout (req 67) */}
      {isEditing && onRemove && (
        <button
          type="button"
          aria-label="Remove placeholder"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 22, height: 22, borderRadius: '50%',
            background: '#dc4444', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
