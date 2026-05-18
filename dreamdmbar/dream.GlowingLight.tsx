'use client';

import type { CSSProperties, KeyboardEvent, MouseEvent, TouchEvent } from 'react';

export interface GlowingLightProps {
  isDragging?: boolean;
  isCollapsed?: boolean;
  firstTime?: boolean;
  tooltip?: string | null;
  onTouchStart?: (e: TouchEvent<HTMLSpanElement>) => void;
  onTouchMove?: (e: TouchEvent<HTMLSpanElement>) => void;
  onTouchEnd?: (e: TouchEvent<HTMLSpanElement>) => void;
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLSpanElement>) => void;
  style?: CSSProperties;
  'aria-label'?: string;
}

export default function GlowingLight({
  isDragging,
  isCollapsed,
  firstTime,
  tooltip,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
  onKeyDown,
  style,
  'aria-label': ariaLabel,
}: GlowingLightProps) {
  const glowSize = isCollapsed ? 14 : 10;
  const glowOpacity = isDragging ? 1.0 : 0.85;
  const spreadPx = isDragging ? 18 : (isCollapsed ? 14 : 10);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? 'DreamDM light — tap to open menus'}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        position: 'relative',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        flexShrink: 0,
        animation: 'sicc-gold-blue-breathe 4s ease-in-out infinite',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'block',
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(ellipse at center, rgba(255,215,64,${glowOpacity}) 0%, rgba(232,184,48,${glowOpacity * 0.55}) 35%, rgba(200,152,26,${glowOpacity * 0.2}) 65%, transparent 100%)`,
          boxShadow: isDragging
            ? `0 0 ${spreadPx * 2}px ${spreadPx}px rgba(255,215,64,0.85), 0 0 ${spreadPx * 4}px ${spreadPx * 2}px rgba(200,152,26,0.45), 0 0 2px rgba(255,245,180,0.90)`
            : `0 0 ${spreadPx}px ${spreadPx / 2}px rgba(255,215,64,${glowOpacity * 0.7}), 0 0 ${spreadPx * 2}px ${spreadPx}px rgba(200,152,26,0.35), 0 0 2px rgba(255,245,180,0.80)`,
          filter: `blur(${isDragging ? 1.5 : 2}px)`,
          borderRadius: '50%',
          transition: 'box-shadow 0.25s ease, filter 0.25s ease, width 0.25s ease, height 0.25s ease',
          animation: firstTime ? 'sicc-gold-breathe 1.4s cubic-bezier(0.45,0.05,0.55,0.95) 3' : undefined,
        }}
      />
      {tooltip && (
        <span
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30,30,30,0.88)',
            color: 'rgba(255,255,255,0.92)',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            marginBottom: 6,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}