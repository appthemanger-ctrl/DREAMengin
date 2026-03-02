'use client';

import React, { useEffect, useState } from 'react';
import type { MenuItem } from './MenuPanel';

type Props = {
  open: boolean;
  items: MenuItem[];
  /** Screen-space center of the anchor button in px */
  anchorX: number;
  anchorY: number;
  accent?: 'blue' | 'gold';
  /** Force fan direction — used when both menus open simultaneously */
  side?: 'left' | 'right';
  onClose: () => void;
};

const ITEM_SIZE = 46; // diameter of each fan item button
const ITEM_DELAY_MS = 28; // stagger delay between each item's spring animation

export default function FanMenu({ open, items, anchorX, anchorY, accent = 'gold', side, onClose }: Props) {
  const [sprung, setSprung] = useState(false);

  useEffect(() => {
    if (open) {
      // one frame delay so CSS transition fires
      const id = requestAnimationFrame(() => setSprung(true));
      return () => cancelAnimationFrame(id);
    } else {
      setSprung(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 390;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 844;

  // Fan angle range: if button is near bottom, fan upward.
  // If near left edge, bias the arc toward the right and upward.
  const isNearLeft  = anchorX < screenW * 0.35;
  const isNearRight = anchorX > screenW * 0.65;
  let startDeg: number, endDeg: number, radius: number;

  if (side === 'left') {
    // Forced left — fan up-left arc (used when both menus open simultaneously)
    startDeg = -175; endDeg = -95; radius = 104;
  } else if (side === 'right') {
    // Forced right — fan up-right arc
    startDeg = -85; endDeg = -5; radius = 104;
  } else if (isNearLeft) {
    // Left side → fan up-right from ~-140° to ~-10°
    startDeg = -140; endDeg = -10; radius = 88;
  } else if (isNearRight) {
    // Right side → fan up-left from ~-170° to ~-40°
    startDeg = -170; endDeg = -40; radius = 88;
  } else {
    // Centre-bottom → wide upward arc
    startDeg = -165; endDeg = -15; radius = 88;
  }

  const count = items.length;

  const accentColor  = accent === 'gold' ? '#d4a843' : '#0ea5e9';
  const accentAlpha  = accent === 'gold' ? 'rgba(212,168,67,0.18)' : 'rgba(14,165,233,0.18)';
  const accentBorder = accent === 'gold' ? 'rgba(212,168,67,0.55)' : 'rgba(14,165,233,0.55)';

  return (
    <>
      {/* Invisible full-screen dismiss layer */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 68 }}
        onPointerDown={onClose}
        aria-hidden="true"
      />

      {/* Fan items */}
      {items.map((item, i) => {
        const t = count > 1 ? i / (count - 1) : 0.5;
        const angleDeg = startDeg + t * (endDeg - startDeg);
        const angleRad = (angleDeg * Math.PI) / 180;

        const cx = anchorX + radius * Math.cos(angleRad);
        const cy = anchorY + radius * Math.sin(angleRad);

        // Clamp to visible screen
        const left = Math.max(4, Math.min(screenW - ITEM_SIZE - 4, cx - ITEM_SIZE / 2));
        const top  = Math.max(4, Math.min(screenH - ITEM_SIZE - 4, cy - ITEM_SIZE / 2));

        // Label placement: left of item if item is right-of-center, else right
        const labelOnLeft = cx > screenW / 2;

        const delay = i * ITEM_DELAY_MS;
        return (
          <div
            key={item.id}
            style={{
              position: 'fixed',
              left,
              top,
              zIndex: 70,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexDirection: labelOnLeft ? 'row-reverse' : 'row',
              pointerEvents: 'auto',
              // spring-out from anchor
              transform: sprung ? 'scale(1)' : 'scale(0)',
              opacity: sprung ? 1 : 0,
              transformOrigin: `${anchorX - left + ITEM_SIZE / 2}px ${anchorY - top + ITEM_SIZE / 2}px`,
              transition: `transform 0.24s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms,
                           opacity 0.16s ease ${delay}ms`,
            }}
          >
            <button
              type="button"
              onClick={() => { item.onSelect(); onClose(); }}
              aria-label={item.label}
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                borderRadius: '50%',
                flexShrink: 0,
                background: accentAlpha,
                border: `1.5px solid ${accentBorder}`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: `0 4px 16px rgba(0,0,0,0.35), 0 0 10px ${accentColor}33`,
              }}
            >
              {item.icon}
            </button>

            {/* Label badge */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: accentColor,
                background: 'rgba(255,255,255,0.92)',
                border: `1px solid ${accentBorder}`,
                backdropFilter: 'blur(8px)',
                borderRadius: 6,
                padding: '3px 7px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </>
  );
}
