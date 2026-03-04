'use client';
// components/connectors/NoSlotDialog.tsx
// When no empty slot is available: "Place now" vs "Later" (req 33)
// No forced edit mode (req 33)

import React from 'react';
import type { WidgetTypeDef } from '@/lib/widgets/widgetRegistry';

export interface NoSlotDialogProps {
  widget: WidgetTypeDef;
  onPlaceNow: () => void;
  onLater: () => void;
}

export default function NoSlotDialog({ widget, onPlaceNow, onLater }: NoSlotDialogProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 75,
        background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onLater}
    >
      <div
        className="de-sheet"
        style={{ width: 'min(22rem, 92vw)', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>{widget.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>
            No empty slots
          </div>
          <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
            Your space is full. You can place {widget.title} now in a custom slot, or save it for later.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            className="de-btn de-btn-primary"
            style={{ width: '100%', padding: '12px' }}
            onClick={onPlaceNow}
          >
            Place now
          </button>
          <button
            type="button"
            className="de-btn de-btn-ghost"
            style={{ width: '100%', padding: '12px' }}
            onClick={onLater}
          >
            Later — save to library
          </button>
        </div>

        <p style={{ fontSize: 10, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 12 }}>
          Saved widgets appear in Add Widgets → Suggested.
        </p>
      </div>
    </div>
  );
}
