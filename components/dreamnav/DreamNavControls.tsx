'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  onHome: () => void;
  onOpenDreamsMenu: () => void;
  onOpenSystemMenu: () => void;
  onLockChange?: (locked: boolean) => void;
};

type Pos = { x: number; y: number };

const CTRL_SIZE = 52;
const RAIL_WIDTH = 0.14;
const SAFE_EDGE_PX = 24; // minimum px from left/right edges to avoid Safari back/forward swipe
const STORAGE_KEY = 'dreamengin:controls:v4';
const DOUBLE_TAP_MS = 280;
const SNAP_ANIM_MS = 160;

/** Shown only once per login session (module-level flag resets on page load). */
let hintShownThisSession = false;

function InfinityHalf({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  const color = side === 'left' ? '#0ea5e9' : '#d4a843';
  return (
    <svg width="26" height="13" viewBox="0 0 80 36" style={{ opacity: 0.92 }}>
      <g transform={flip ? 'translate(80,0) scale(-1,1)' : undefined}>
        <path d="M10 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
        <path d="M10 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

export default function DreamNavControls({ onHome, onOpenDreamsMenu, onOpenSystemMenu, onLockChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const [locked, setLocked] = useState(true);
  const lockedRef = useRef(true);
  /** "Double tap to unlock" hint — shown only once per login session */
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** "NAV mode" indicator — briefly shown on entering NAV MODE */
  const [showNavMode, setShowNavMode] = useState(false);
  const navModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gravityRAFRef = useRef<number | null>(null);

  const posRef = useRef<Pos>({ x: 0, y: 0 });
  const savedPosRef = useRef<Pos>({ x: 0, y: 0 });
  const elRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startClient: { x: number; y: number };
    startPos: Pos;
    moved: boolean;
  }>({ active: false, startClient: { x: 0, y: 0 }, startPos: { x: 0, y: 0 }, moved: false });
  const tapRef = useRef<{ at: number; timer: ReturnType<typeof setTimeout> | null }>({
    at: 0, timer: null,
  });

  const dismissHint = useCallback(() => {
    if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
    setShowHint(false);
  }, []);

  const dismissNavMode = useCallback(() => {
    if (navModeTimerRef.current) { clearTimeout(navModeTimerRef.current); navModeTimerRef.current = null; }
    setShowNavMode(false);
  }, []);

  const getRails = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rail = w * RAIL_WIDTH;
    return {
      rightX: Math.min(w - CTRL_SIZE - SAFE_EDGE_PX, Math.round(w - rail + (rail - CTRL_SIZE) / 2)),
      minY: 64,
      maxY: h - CTRL_SIZE - 44,
      centerX: Math.round((w - CTRL_SIZE) / 2),
    };
  };

  const applyPos = () => {
    const p = posRef.current;
    const el = elRef.current;
    if (el) el.style.transform = `translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0)`;
  };

  const setLockState = (val: boolean) => {
    lockedRef.current = val;
    setLocked(val);
    (window as Window & { __deNavLocked?: boolean }).__deNavLocked = val;
    onLockChange?.(val);
  };

  const animateTo = (target: Pos) => {
    const el = elRef.current;
    if (!el) return;
    const from = `translate3d(${Math.round(posRef.current.x)}px,${Math.round(posRef.current.y)}px,0)`;
    const to = `translate3d(${Math.round(target.x)}px,${Math.round(target.y)}px,0)`;
    posRef.current = target;
    el.animate([{ transform: from }, { transform: to }], {
      duration: SNAP_ANIM_MS, easing: 'ease-out', fill: 'forwards',
    });
    el.style.transform = to;
  };

  const snapToSavedCorner = () => {
    const rails = getRails();
    animateTo({
      x: rails.rightX,
      y: Math.min(Math.max(savedPosRef.current.y, rails.minY), rails.maxY),
    });
    setLockState(false);
  };

  const lockToCenter = () => {
    const rails = getRails();
    savedPosRef.current = { ...posRef.current };
    const y = Math.min(Math.max(posRef.current.y, rails.minY), rails.maxY);
    animateTo({ x: rails.centerX, y });
    setLockState(true);
  };

  // Init from storage
  useEffect(() => {
    const rails = getRails();
    const defaultPos = { x: rails.rightX, y: rails.maxY - 48 };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved) as Pos;
        savedPosRef.current = { x: rails.rightX, y: Math.min(Math.max(p.y, rails.minY), rails.maxY) };
      } else {
        savedPosRef.current = { ...defaultPos };
      }
    } catch {
      savedPosRef.current = { ...defaultPos };
    }
    // Start locked at center-bottom
    const lockY = rails.maxY - 48;
    posRef.current = { x: rails.centerX, y: lockY };
    lockedRef.current = true;
    setMounted(true);
    requestAnimationFrame(() => { applyPos(); });

    // Show "Double tap to unlock" hint once per login session
    if (!hintShownThisSession) {
      hintShownThisSession = true;
      hintTimerRef.current = setTimeout(() => {
        setShowHint(true);
        hintTimerRef.current = setTimeout(() => {
          setShowHint(false);
          hintTimerRef.current = null;
        }, 2000);
      }, 400);
    }

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (navModeTimerRef.current) clearTimeout(navModeTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dismiss hint immediately on any pointer interaction
  useEffect(() => {
    if (!showHint) return;
    const handler = () => dismissHint();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [showHint, dismissHint]);

  // Dismiss NAV mode indicator on any pointer interaction
  useEffect(() => {
    if (!showNavMode) return;
    const handler = () => dismissNavMode();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [showNavMode, dismissNavMode]);

  // Gravity: when unlocked, slowly pull button toward center-bottom
  useEffect(() => {
    if (!mounted || locked) {
      if (gravityRAFRef.current != null) { cancelAnimationFrame(gravityRAFRef.current); gravityRAFRef.current = null; }
      return;
    }
    const tick = () => {
      if (lockedRef.current) { gravityRAFRef.current = null; return; }
      if (!dragRef.current.active) {
        const rails = getRails();
        const target = { x: rails.centerX, y: rails.maxY };
        const curr = posRef.current;
        const dx = target.x - curr.x;
        const dy = target.y - curr.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.5) {
          const speed = Math.max(0.2, dist * 0.004);
          posRef.current = {
            x: curr.x + (dx / dist) * Math.min(speed, dist),
            y: curr.y + (dy / dist) * Math.min(speed, dist),
          };
          applyPos();
        }
      }
      gravityRAFRef.current = requestAnimationFrame(tick);
    };
    gravityRAFRef.current = requestAnimationFrame(tick);
    return () => {
      if (gravityRAFRef.current != null) { cancelAnimationFrame(gravityRAFRef.current); gravityRAFRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, mounted]);

  const handleTap = () => {
    const now = performance.now();
    const isDouble = now - tapRef.current.at < DOUBLE_TAP_MS;
    tapRef.current.at = now;
    if (tapRef.current.timer) { clearTimeout(tapRef.current.timer); tapRef.current.timer = null; }

    if (isDouble) {
      if (lockedRef.current) {
        // Double tap while locked → enter NAV MODE (SPEC §3.1)
        snapToSavedCorner();
        dismissHint();
        setShowNavMode(true);
        navModeTimerRef.current = setTimeout(() => {
          setShowNavMode(false);
          navModeTimerRef.current = null;
        }, 2000);
      } else {
        // Double tap in NAV MODE → open System menu (SPEC §3.1)
        onOpenSystemMenu();
      }
      return;
    }

    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      if (lockedRef.current) {
        // Single tap while locked → open Daydreams menu (SPEC §3.1)
        onOpenDreamsMenu();
      } else {
        // Single tap in NAV MODE → Go Home (SPEC §3.1)
        onHome();
      }
    }, DOUBLE_TAP_MS + 10);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startClient: { x: e.clientX, y: e.clientY },
      startPos: { ...posRef.current },
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const rails = getRails();
    const dx = e.clientX - drag.startClient.x;
    const dy = e.clientY - drag.startClient.y;
    if (!drag.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) drag.moved = true;
    if (!drag.moved) return;

    if (lockedRef.current) {
      // Locked: button moves vertically only, stays at centerX
      const y = Math.min(Math.max(drag.startPos.y + dy, rails.minY), rails.maxY);
      posRef.current = { x: rails.centerX, y };
      applyPos();
      return;
    }

    // Unlocked: button slides along right rail (vertical only)
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
    } else if (!lockedRef.current) {
      // Persist position on drag end
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current)); } catch { /* noop */ }
    }
  };

  if (!mounted) return null;

  const baseStyle: React.CSSProperties = {
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
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 58 }}>
      {/* "Double tap to unlock" hint — non-blocking, once per session */}
      {locked && showHint && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 61,
            padding: '5px 14px',
            borderRadius: 9999,
            background: 'rgba(200,152,26,0.15)',
            border: '1px solid rgba(200,152,26,0.4)',
            color: '#c8981a',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Double-tap to unlock
        </div>
      )}

      {/* "NAV mode" indicator — brief, non-blocking */}
      {showNavMode && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 65,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 16px',
            borderRadius: 9999,
            background: 'rgba(5,15,45,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(100,150,255,0.15)',
            color: 'rgba(160,185,255,0.7)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--de-gold, #d4a843)',
              boxShadow: '0 0 6px var(--de-gold, #d4a843)',
              flexShrink: 0,
            }}
          />
          NAV mode
        </div>
      )}

      {/* Gold home button (right rail when unlocked, center when locked) */}
      <button
        ref={(el) => { elRef.current = el; }}
        type="button"
        aria-label={locked ? 'Tap to open Daydreams menu · Double-tap to unlock NAV mode' : 'Go Home · Double-tap for System menu'}
        style={{
          ...baseStyle,
          background: locked
            ? 'linear-gradient(135deg,#92400e,#d4a843)'
            : 'linear-gradient(135deg,#a16207,#d4a843)',
          border: locked ? '2px solid #d4a843' : '1px solid rgba(255,255,255,0.3)',
          boxShadow: locked
            ? '0 0 0 2px #0ea5e9, 0 0 28px rgba(212,168,67,0.5)'
            : '0 4px 18px rgba(212,168,67,0.5)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current.active = false; }}
      >
        <InfinityHalf side="right" />
      </button>
    </div>
  );
}
