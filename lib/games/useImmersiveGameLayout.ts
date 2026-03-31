'use client';

import type { CSSProperties } from 'react';
import { usePathname } from 'next/navigation';

export function useImmersiveGameLayout() {
  const pathname = usePathname();
  return pathname === '/daydream/game';
}

export function getImmersiveCanvasStyle(border = 'none'): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    display: 'block',
    borderRadius: 0,
    border,
    outline: 'none',
    margin: 0,
  };
}

export function getImmersiveStageStyle(): CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
  };
}

export function getImmersiveOverlayStyle(position: 'top-left' | 'top-right' = 'top-left'): CSSProperties {
  return {
    position: 'absolute',
    top: 12,
    ...(position === 'top-right' ? { right: 12 } : { left: 12 }),
    zIndex: 2,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(2, 6, 23, 0.68)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(241,245,249,0.88)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  };
}
