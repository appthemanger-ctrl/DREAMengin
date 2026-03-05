'use client';

import React, { useEffect, useRef } from 'react';

export type MenuItem = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  onSelect: () => void;
};

type Props = {
  open: boolean;
  items: MenuItem[];
  onClose: () => void;
  title: string;
  /** Accent color for the panel header dot and border */
  accent?: 'blue' | 'gold';
  /**
   * Side placement for when both menus are shown simultaneously (SPEC §3.1).
   * 'center' (default) = standard centered overlay.
   * 'left' | 'right'   = positioned to that side for side-by-side display.
   */
  side?: 'left' | 'right' | 'center';
};

const ACCENT_STYLES = {
  blue: {
    dot: '#38bdf8',
    border: 'rgba(14,165,233,0.35)',
    glow: '0 0 24px rgba(14,165,233,0.18)',
  },
  gold: {
    dot: '#d4a843',
    border: 'rgba(212,168,67,0.35)',
    glow: '0 0 24px rgba(212,168,67,0.18)',
  },
};

export default function MenuPanel({ open, items, onClose, title, accent = 'blue', side = 'center' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const colors = ACCENT_STYLES[accent];

  const panelPosition: React.CSSProperties =
    side === 'left'
      ? { position: 'absolute', left: '4vw', top: '50%', transform: 'translateY(-42%)' }
      : side === 'right'
      ? { position: 'absolute', right: '4vw', top: '50%', transform: 'translateY(-42%)' }
      : { position: 'relative', top: '8vh' };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Dismiss on any pointer down outside the panel
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} menu`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: side !== 'center' ? 'transparent' : 'rgba(15,42,92,0.15)',
        backdropFilter: side !== 'center' ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: side !== 'center' ? 'none' : 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'de-menu-overlay-in 0.18s ease-out',
        pointerEvents: side !== 'center' ? 'none' : 'auto',
      }}
      onPointerDown={side !== 'center' ? undefined : handleOverlayPointerDown}
    >
      <div
        ref={panelRef}
        style={{
          ...panelPosition,
          width: 'min(320px, 88vw)',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid rgba(160,195,240,0.45)`,
          borderRadius: 20,
          boxShadow: `0 8px 40px rgba(15,42,92,0.12), ${colors.glow}`,
          overflow: 'hidden',
          animation: 'de-menu-panel-in 0.22s cubic-bezier(0.34,1.36,0.64,1)',
          pointerEvents: 'auto',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px 12px',
            borderBottom: `1px solid rgba(160,195,240,0.18)`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.dot,
              boxShadow: `0 0 8px ${colors.dot}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--de-text-dim)',
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              marginLeft: 'auto',
              background: 'rgba(14,165,233,0.12)',
              border: 'none',
              borderRadius: 9999,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--de-accent)',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Item list */}
        <div style={{ padding: '6px 0 8px' }}>
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { item.onSelect(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                minHeight: 52, // req 36: minimum 44px row height
                padding: '0 20px',
                background: 'none',
                border: 'none',
                borderTop: idx > 0 ? '1px solid rgba(160,195,240,0.18)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.12s',
              }}
              onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,165,233,0.06)'; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              {item.icon && (
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, width: 26, textAlign: 'center' }}>
                  {item.icon}
                </span>
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--de-heading)',
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
                </div>
                {item.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--de-text-dim)',
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}
                  >
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
