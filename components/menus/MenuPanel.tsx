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

const SIDE_MENU_LAYER_Z_INDEX = 58;
const SIDE_MENU_CIRCLE_SIDE_OFFSET = '-42vw';
const SIDE_MENU_CIRCLE_BOTTOM_OFFSET = '-62vw';
const SIDE_MENU_HEADER_PADDING_LEFT = '26px 24px 8px 72px';
const SIDE_MENU_HEADER_PADDING_RIGHT = '26px 72px 8px 24px';
const SIDE_MENU_ITEMS_PADDING_LEFT = '8px 20px 52px 68px';
const SIDE_MENU_ITEMS_PADDING_RIGHT = '8px 68px 52px 20px';

export default function MenuPanel({ open, items, onClose, title, accent = 'blue', side = 'center' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const colors = ACCENT_STYLES[accent];
  const sideMode = side !== 'center';

  const panelPosition: React.CSSProperties =
    side === 'left'
      ? { position: 'fixed', left: SIDE_MENU_CIRCLE_SIDE_OFFSET, bottom: SIDE_MENU_CIRCLE_BOTTOM_OFFSET }
      : side === 'right'
      ? { position: 'fixed', right: SIDE_MENU_CIRCLE_SIDE_OFFSET, bottom: SIDE_MENU_CIRCLE_BOTTOM_OFFSET }
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
       aria-modal={sideMode ? undefined : 'true'}
       aria-label={`${title} menu`}
       style={{
         position: 'fixed',
         inset: 0,
         // Keep side menus below the fixed home button (z-index 60), but above core content.
         zIndex: sideMode ? SIDE_MENU_LAYER_Z_INDEX : 70,
         background: sideMode ? 'transparent' : 'rgba(2,8,24,0.55)',
         backdropFilter: sideMode ? 'none' : 'blur(10px)',
         WebkitBackdropFilter: sideMode ? 'none' : 'blur(10px)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         animation: 'de-menu-overlay-in 0.18s ease-out',
         pointerEvents: sideMode ? 'none' : 'auto',
       }}
       onPointerDown={sideMode ? undefined : handleOverlayPointerDown}
     >
       <div
         ref={panelRef}
         style={{
           ...panelPosition,
           width: sideMode ? 'min(96vw, 720px)' : 'min(320px, 88vw)',
           aspectRatio: sideMode ? '1 / 1' : undefined,
           background: sideMode ? 'rgba(216,225,237,0.28)' : 'rgba(8,18,48,0.92)',
           backdropFilter: sideMode ? 'blur(26px) saturate(125%)' : 'blur(28px)',
           WebkitBackdropFilter: sideMode ? 'blur(26px) saturate(125%)' : 'blur(28px)',
           border: `1px solid ${colors.border}`,
           borderRadius: sideMode ? '50%' : 20,
           boxShadow: sideMode
             ? `0 20px 80px rgba(0,0,0,0.24), ${colors.glow}`
             : `0 24px 64px rgba(0,0,0,0.45), ${colors.glow}`,
           overflow: 'hidden',
           animation: 'de-menu-panel-in 0.22s cubic-bezier(0.34,1.36,0.64,1)',
           pointerEvents: 'auto',
           clipPath: side === 'left'
             ? 'inset(0 50% 0 0 round 50%)'
             : side === 'right'
             ? 'inset(0 0 0 50% round 50%)'
             : undefined,
         }}
         onPointerDown={(e) => e.stopPropagation()}
       >
         {/* Header */}
         <div
           style={{
             display: 'flex',
             alignItems: 'center',
             gap: 10,
             padding: sideMode
               ? side === 'left'
                 ? SIDE_MENU_HEADER_PADDING_LEFT
                 : SIDE_MENU_HEADER_PADDING_RIGHT
               : '16px 20px 12px',
             borderBottom: sideMode ? 'none' : '1px solid rgba(255,255,255,0.07)',
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
                color: sideMode ? 'rgba(245,252,255,0.88)' : 'rgba(180,210,255,0.75)',
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
               background: 'rgba(255,255,255,0.07)',
               border: 'none',
               borderRadius: 9999,
               width: 28,
               height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
               color: sideMode ? 'rgba(245,252,255,0.86)' : 'rgba(180,210,255,0.6)',
               fontSize: 14,
               flexShrink: 0,
               opacity: sideMode ? 0.75 : 1,
             }}
           >
             ✕
           </button>
         </div>

         {/* Item list */}
         <div style={{ padding: sideMode ? (side === 'left' ? SIDE_MENU_ITEMS_PADDING_LEFT : SIDE_MENU_ITEMS_PADDING_RIGHT) : '6px 0 8px' }}>
           {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                aria-label={sideMode && item.description ? `${item.label} — ${item.description}` : item.label}
                onClick={() => { item.onSelect(); onClose(); }}
                style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: 14,
                 width: '100%',
                  minHeight: sideMode ? 44 : 52,
                 padding: sideMode ? '0 8px' : '0 20px',
                 background: sideMode ? 'rgba(255,255,255,0.08)' : 'none',
                 border: 'none',
                 borderTop: idx > 0 ? (sideMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)') : 'none',
                 borderRadius: sideMode ? 14 : 0,
                 cursor: 'pointer',
                 textAlign: 'left',
                 WebkitTapHighlightColor: 'transparent',
                 transition: 'background 0.12s',
                 marginBottom: sideMode ? 8 : 0,
               }}
               onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = sideMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'; }}
               onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = sideMode ? 'rgba(255,255,255,0.08)' : 'none'; }}
             >
               {item.icon && (
                 <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, width: 26, textAlign: 'center' }}>
                   {item.icon}
                 </span>
               )}
               <div style={{ flex: 1 }}>
                 <div
                   style={{
                     fontSize: sideMode ? 14 : 15,
                     fontWeight: 600,
                     color: sideMode ? 'rgba(247,252,255,0.95)' : 'rgba(220,235,255,0.92)',
                     lineHeight: 1.3,
                   }}
                 >
                   {item.label}
                 </div>
                 {!sideMode && item.description && (
                   <div
                     style={{
                       fontSize: 12,
                      color: 'rgba(160,185,255,0.5)',
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
