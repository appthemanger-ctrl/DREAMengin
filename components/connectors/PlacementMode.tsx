'use client';
// components/connectors/PlacementMode.tsx
// Short placement mode overlay (req 36-40)
//
// • Clear Done / Cancel controls (req 36)
// • Reversible via Undo (req 37)
// • Does NOT change navigation mode — UI-local (req 38)
// • Respects scroll, does not steal gestures from feeds (req 39)
// • Exits to LOCKED safe mode (req 40)

import React, { useCallback, useEffect, useState } from 'react';
import type { WidgetTypeDef } from '@/lib/widgets/widgetRegistry';
import { handlePlacementCancel, handlePlacementDone } from '@/lib/connectors/installFlow';

export interface PlacedWidget {
  widgetId: string;
  slot: number;
}

export interface PlacementModeProps {
  widget: WidgetTypeDef;
  totalSlots: number;
  filledSlots: Set<number>;
  onDone: (placement: PlacedWidget) => void;
  onCancel: () => void;
  /** Called when auto-lock fires (req 40) */
  onAutoLock: () => void;
}

export default function PlacementMode({
  widget,
  totalSlots,
  filledSlots,
  onDone,
  onCancel,
  onAutoLock,
}: PlacementModeProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]); // for Undo (req 37)

  function handleSlotTap(slot: number) {
    if (filledSlots.has(slot)) return;
    setHistory((prev) => [...prev, slot]);
    setChosen(slot);
  }

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      const next = [...prev];
      next.pop();
      setChosen(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  }, [widget.id]);

  function handleDone() {
    if (chosen === null) return;
    handlePlacementDone(onAutoLock); // req 40: return to LOCKED
    onDone({ widgetId: widget.id, slot: chosen });
  }

  function handleCancel() {
    handlePlacementCancel(onAutoLock); // req 40
    onCancel();
  }

  // Keyboard: Escape cancels (req 36)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
     
  }, []);

  return (
    // Note: overlay uses pointer-events only on the bar — does NOT block scroll (req 39)
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        // Transparent overlay — scroll and gestures pass through (req 39)
        pointerEvents: 'none',
      }}
    >
      {/* Slot grid — only the slot buttons have pointer-events */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(totalSlots, 4)}, 1fr)`,
        gap: 12, padding: 16, alignContent: 'start',
        pointerEvents: 'none',
      }}>
        {Array.from({ length: totalSlots }, (_, i) => {
          const filled = filledSlots.has(i);
          const selected = chosen === i;
          return (
            <button
              key={i}
              type="button"
              aria-label={filled ? `Slot ${i + 1} occupied` : `Place in slot ${i + 1}`}
              disabled={filled}
              onClick={() => handleSlotTap(i)}
              style={{
                pointerEvents: 'auto',
                height: 80, borderRadius: 14,
                border: selected
                  ? '2px solid var(--de-accent)'
                  : filled
                  ? '2px solid rgba(160,195,240,0.2)'
                  : '2px dashed rgba(42,138,184,0.45)',
                background: selected
                  ? 'rgba(42,138,184,0.15)'
                  : filled
                  ? 'rgba(160,195,240,0.1)'
                  : 'rgba(42,138,184,0.04)',
                cursor: filled ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: filled ? 14 : 20,
                color: selected ? 'var(--de-accent)' : 'rgba(42,138,184,0.5)',
                transition: 'background 120ms, border-color 120ms',
              }}
            >
              {filled ? '■' : selected ? widget.icon : '+'}
            </button>
          );
        })}
      </div>

      {/* Control bar — fixed at top, pointer-events auto (req 36) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 61,
        background: 'rgba(245,250,255,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(160,195,240,0.4)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{widget.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>
              Choose a slot
            </div>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
              Tap an empty slot to place {widget.title}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              style={{
                padding: '7px 12px', borderRadius: 10,
                background: 'rgba(160,195,240,0.2)',
                border: '1px solid rgba(160,195,240,0.4)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                color: 'var(--de-text)',
              }}
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '7px 12px', borderRadius: 10,
              background: 'rgba(160,195,240,0.15)',
              border: '1px solid rgba(160,195,240,0.3)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              color: 'var(--de-text-dim)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={chosen === null}
            onClick={handleDone}
            style={{
              padding: '7px 14px', borderRadius: 10,
              background: chosen !== null ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
              border: 'none',
              fontSize: 11, fontWeight: 700, cursor: chosen !== null ? 'pointer' : 'default',
              color: chosen !== null ? '#fff' : 'var(--de-text-dim)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
