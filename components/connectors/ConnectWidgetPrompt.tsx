'use client';
// components/connectors/ConnectWidgetPrompt.tsx
// Compact "Add {Service} as a widget?" prompt (req 11-20)
//
// • Appears near bottom, above OS controls (req 19)
// • Fade + slide-up animation 150-200ms (req 20)
// • Non-blocking: does not prevent scroll or taps outside (req 13)
// • Auto-dismisses after 8 s if ignored (req 7)
// • One prompt at a time (req 18)
// • Dismisses when a menu opens (req 14) — caller passes menuOpen prop
// • Offers "Add" and "Not now" only — no surprise auto-add (req 4, 12)
// • Optionally offers "Add as Feed Slice" (req 51)

import React, { useEffect, useRef, useState } from 'react';
import type { WidgetTypeDef } from '@/lib/widgets/widgetRegistry';

const AUTO_DISMISS_MS = 8000;

export interface ConnectWidgetPromptProps {
  /** The connector whose widgets are being offered */
  connectorName: string;
  connectorId: string;
  /** Widget types to offer (first one is the primary prompt, req 12) */
  widgetTypes: WidgetTypeDef[];
  /** Whether any menu is currently open — causes immediate dismissal (req 14) */
  menuOpen?: boolean;
  /** Called when user taps Add */
  onAdd: (widgetId: string) => void;
  /** Called when user taps "Not now" or prompt auto-dismisses */
  onDismiss: (widgetId: string) => void;
  /** Called when user taps "Add as Feed Slice" (req 51) */
  onAddSlice?: (connectorId: string) => void;
}

/**
 * ConnectWidgetPrompt — shows immediately after a successful connection.
 * Only one should be mounted at a time (parent is responsible for req 18).
 */
export default function ConnectWidgetPrompt({
  connectorName,
  connectorId,
  widgetTypes,
  menuOpen,
  onAdd,
  onDismiss,
  onAddSlice,
}: ConnectWidgetPromptProps) {
  const primary = widgetTypes[0];
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount → fade in (req 20)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss after AUTO_DISMISS_MS (req 7)
  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dismiss when any menu opens (req 14)
  useEffect(() => {
    if (menuOpen) dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  function dismiss() {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (primary) onDismiss(primary.id);
  }

  function handleAdd() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (primary) onAdd(primary.id);
  }

  if (!primary) return null;

  return (
    // Outer wrapper: pointer-events none so taps pass through backdrop (req 13)
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 70,
        display: 'flex',
        justifyContent: 'center',
        // pointer-events none so the area around the card is fully tappable (req 13)
        pointerEvents: 'none',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', // above OS controls (req 19)
      }}
    >
      {/* Card — pointer-events auto only on the card itself (req 13) */}
      <div
        role="dialog"
        aria-label={`Add ${connectorName} as a Dream`}
        style={{
          pointerEvents: 'auto',
          background: 'rgba(245,250,255,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(160,195,240,0.5)',
          borderRadius: 18,
          padding: '14px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxWidth: 360,
          width: 'calc(100vw - 32px)',
          // Fade + slide-up 160ms (req 20)
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 160ms ease, transform 160ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Service icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(42,138,184,0.10)',
            border: '1px solid rgba(42,138,184,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {primary.icon}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.3 }}>
              Add {connectorName} as a Dream?
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
              {primary.description}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'var(--de-accent)',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(160,195,240,0.15)',
              border: '1px solid rgba(160,195,240,0.3)',
              color: 'var(--de-text-dim)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Not now
          </button>
        </div>

        {/* Optional: "Add as Feed Slice" (req 51) */}
        {onAddSlice && (
          <button
            type="button"
            onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); onAddSlice(connectorId); }}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '7px 14px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px dashed rgba(42,138,184,0.35)',
              color: 'var(--de-accent)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add as Feed Slice instead
          </button>
        )}
      </div>
    </div>
  );
}
