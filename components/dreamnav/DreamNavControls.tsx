'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  /** Single tap → go home */
  onHome: () => void;
  /** Double tap → open both menus (Daydreams + System) simultaneously */
  onBothMenus: () => void;
};

type Pos = { x: number; y: number };

const CTRL_SIZE    = 52;
const RAIL_WIDTH   = 0.14;
const SAFE_EDGE_PX = 24;          // min px from edges — avoid Safari swipe zones
const STORAGE_KEY  = 'dreamengin:controls:v4';
const DOUBLE_TAP_MS = 280;
const SNAP_ANIM_MS  = 160;

function GoldSymbol() {
  return (
    <svg width="26" height="13" viewBox="0 0 80 36" style={{ opacity: 0.92 }}>
      <g transform="translate(80,0) scale(-1,1)">
        <path d="M10 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke="#d4a843" strokeWidth="6" strokeLinecap="round" />
        <path d="M10 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke="#d4a843" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * DreamNavControls — single gold button, always on right rail.
 *
 * Behavior (§6.1 — updated, NAV MODE removed):
 *   Single tap  → Go Home (reset to anchor)
 *   Double tap  → Open both menus simultaneously: Daydreams (left) + System (right)
 *   Drag        → Reposition vertically along right rail
 *   Position    → Persists in localStorage key `dreamengin:controls:v4`
 */
export default function DreamNavControls({ onHome, onBothMenus }: Props) {
  const [mounted, setMounted] = useState(false);

  const posRef  = useRef<Pos>({ x: 0, y: 0 });
  const elRef   = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startClient: { x: number; y: number };
    startPos: Pos;
    moved: boolean;
  }>({ active: false, startClient: { x: 0, y: 0 }, startPos: { x: 0, y: 0 }, moved: false });
  const tapRef  = useRef<{ at: number; timer: ReturnType<typeof setTimeout> | null }>({
    at: 0, timer: null,
  });

  const getRails = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rail = w * RAIL_WIDTH;
    return {
      rightX: Math.min(w - CTRL_SIZE - SAFE_EDGE_PX, Math.round(w - rail + (rail - CTRL_SIZE) / 2)),
      minY: 64,
      maxY: h - CTRL_SIZE - 44,
    };
  };

  const applyPos = () => {
    const el = elRef.current;
    if (el) el.style.transform = `translate3d(${Math.round(posRef.current.x)}px,${Math.round(posRef.current.y)}px,0)`;
  };

  const animateTo = (target: Pos) => {
    const el = elRef.current;
    if (!el) return;
    const from = `translate3d(${Math.round(posRef.current.x)}px,${Math.round(posRef.current.y)}px,0)`;
    const to   = `translate3d(${Math.round(target.x)}px,${Math.round(target.y)}px,0)`;
    posRef.current = target;
    el.animate([{ transform: from }, { transform: to }], { duration: SNAP_ANIM_MS, easing: 'ease-out', fill: 'forwards' });
    el.style.transform = to;
  };

  // Mount: load persisted Y, place on right rail
  useEffect(() => {
    const rails = getRails();
    let savedY = rails.maxY - 80;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Pos;
        savedY = Math.min(Math.max(p.y, rails.minY), rails.maxY);
      }
    } catch { /* noop */ }
    posRef.current = { x: rails.rightX, y: savedY };
    setMounted(true);
    requestAnimationFrame(() => { applyPos(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = () => {
    const now = performance.now();
    const isDouble = now - tapRef.current.at < DOUBLE_TAP_MS;
    tapRef.current.at = now;
    if (tapRef.current.timer) { clearTimeout(tapRef.current.timer); tapRef.current.timer = null; }

    if (isDouble) {
      // Double tap → open both Daydreams + System menus side by side
      onBothMenus();
      return;
    }

    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      // Single tap → Go Home
      onHome();
    }, DOUBLE_TAP_MS + 10);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startClient: { x: e.clientX, y: e.clientY }, startPos: { ...posRef.current }, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const rails = getRails();
    const dx = e.clientX - drag.startClient.x;
    const dy = e.clientY - drag.startClient.y;
    if (!drag.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) drag.moved = true;
    if (!drag.moved) return;
    // Vertical slide along right rail only
    const y = Math.min(Math.max(drag.startPos.y + dy, rails.minY), rails.maxY);
    posRef.current = { x: rails.rightX, y };
    applyPos();
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    dragRef.current.active = false;
    if (!drag.moved) {
      handleTap();
    } else {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current)); } catch { /* noop */ }
      // Re-snap to right rail X in case of resize drift
      const rails = getRails();
      animateTo({ x: rails.rightX, y: posRef.current.y });
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 58 }}>
      <button
        ref={(el) => { elRef.current = el; }}
        type="button"
        aria-label="Tap to go home · Double-tap to open Daydreams and System menus"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: CTRL_SIZE,
          height: CTRL_SIZE,
          borderRadius: 9999,
          touchAction: 'none',
          pointerEvents: 'auto',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          WebkitTapHighlightColor: 'transparent',
          background: 'linear-gradient(135deg,#a16207,#d4a843)',
          border: '2px solid rgba(212,168,67,0.7)',
          boxShadow: '0 0 0 2px rgba(14,165,233,0.35), 0 4px 20px rgba(212,168,67,0.45)',
          transition: 'box-shadow 0.15s',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current.active = false; }}
      >
        <GoldSymbol />
      </button>
    </div>
  );
}
