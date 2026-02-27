'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type ControlId = 'dreams' | 'system';
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
const SNAP_DISTANCE = 88;
const LOCK_HYSTERESIS = 52; // distance to unlock (larger than snap to avoid flicker)
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
  /** "Double tap to unlock" hint — shown only once per login session (req 3, 5) */
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** "NAV mode" indicator — briefly shown on entering NAV MODE (req 12) */
  const [showNavMode, setShowNavMode] = useState(false);
  const navModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gravityRAFRef = useRef<number | null>(null);

  const posRef = useRef<Record<ControlId, Pos>>({ dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } });
  const savedPosRef = useRef<Record<ControlId, Pos>>({ dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } });
  const elRef = useRef<Record<ControlId, HTMLButtonElement | null>>({ dreams: null, system: null });
  const dragRef = useRef<{
    id: ControlId | null;
    startClient: { x: number; y: number };
    startPos: Record<ControlId, Pos>;
    moved: boolean;
  }>({ id: null, startClient: { x: 0, y: 0 }, startPos: { dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } }, moved: false });
  const tapRef = useRef<{ id: ControlId | null; at: number; timer: ReturnType<typeof setTimeout> | null }>({
    id: null, at: 0, timer: null,
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
      leftX: Math.max(SAFE_EDGE_PX, Math.round((rail - CTRL_SIZE) / 2)),
      rightX: Math.min(w - CTRL_SIZE - SAFE_EDGE_PX, Math.round(w - rail + (rail - CTRL_SIZE) / 2)),
      minY: 64,
      maxY: h - CTRL_SIZE - 44,
      centerX: Math.round((w - CTRL_SIZE) / 2),
    };
  };

  const applyPos = (id: ControlId) => {
    const p = posRef.current[id];
    const el = elRef.current[id];
    if (el) el.style.transform = `translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0)`;
  };

  const setLockState = (val: boolean) => {
    lockedRef.current = val;
    setLocked(val);
    (window as Window & { __deNavLocked?: boolean }).__deNavLocked = val;
    onLockChange?.(val);
  };

  const animateTo = (id: ControlId, target: Pos) => {
    const el = elRef.current[id];
    if (!el) return;
    const from = `translate3d(${Math.round(posRef.current[id].x)}px,${Math.round(posRef.current[id].y)}px,0)`;
    const to = `translate3d(${Math.round(target.x)}px,${Math.round(target.y)}px,0)`;
    posRef.current[id] = target;
    el.animate([{ transform: from }, { transform: to }], {
      duration: SNAP_ANIM_MS, easing: 'ease-out', fill: 'forwards',
    });
    el.style.transform = to;
  };

  const snapToSavedCorners = () => {
    const rails = getRails();
    const dreamsTarget = {
      x: rails.rightX,
      y: Math.min(Math.max(savedPosRef.current.dreams.y, rails.minY), rails.maxY),
    };
    const systemTarget = {
      x: rails.leftX,
      y: Math.min(Math.max(savedPosRef.current.system.y, rails.minY), rails.maxY),
    };
    animateTo('dreams', dreamsTarget);
    animateTo('system', systemTarget);
    setLockState(false);
  };

  const lockToCenter = () => {
    const rails = getRails();
    // Save positions before locking
    savedPosRef.current = {
      dreams: { ...posRef.current.dreams },
      system: { ...posRef.current.system },
    };
    const midY = Math.round((posRef.current.dreams.y + posRef.current.system.y) / 2);
    const y = Math.min(Math.max(midY, rails.minY), rails.maxY);
    animateTo('dreams', { x: rails.centerX, y });
    animateTo('system', { x: rails.centerX, y });
    setLockState(true);
  };

  const checkMagnet = () => {
    const a = posRef.current.dreams;
    const b = posRef.current.system;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (!lockedRef.current && dist < SNAP_DISTANCE) lockToCenter();
    else if (lockedRef.current && dist > LOCK_HYSTERESIS) setLockState(false);
  };

  // Init from storage
  useEffect(() => {
    const rails = getRails();
    const defaults = {
      dreams: { x: rails.rightX, y: rails.maxY - 48 },
      system: { x: rails.leftX, y: rails.maxY - 48 },
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved) as Record<ControlId, Pos>;
        savedPosRef.current.dreams = { x: rails.rightX, y: Math.min(Math.max(p.dreams.y, rails.minY), rails.maxY) };
        savedPosRef.current.system = { x: rails.leftX, y: Math.min(Math.max(p.system.y, rails.minY), rails.maxY) };
      } else {
        savedPosRef.current = { ...defaults };
      }
    } catch {
      savedPosRef.current = { ...defaults };
    }
    // Start locked at center-bottom
    const lockY = rails.maxY - 48;
    posRef.current.dreams = { x: rails.centerX, y: lockY };
    posRef.current.system = { x: rails.centerX, y: lockY };
    lockedRef.current = true;
    setMounted(true);
    requestAnimationFrame(() => { applyPos('dreams'); applyPos('system'); });

    // Show "Double tap to unlock" hint once per login session (req 3, 5)
    if (!hintShownThisSession) {
      hintShownThisSession = true;
      hintTimerRef.current = setTimeout(() => {
        setShowHint(true);
        // Auto-dismiss after ~2s (req 3)
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

  // Dismiss hint immediately on any pointer interaction (req 4)
  useEffect(() => {
    if (!showHint) return;
    const handler = () => dismissHint();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [showHint, dismissHint]);

  // Dismiss NAV mode indicator on any pointer interaction (req 13)
  useEffect(() => {
    if (!showNavMode) return;
    const handler = () => dismissNavMode();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [showNavMode, dismissNavMode]);

  // Gravity: when unlocked, slowly pull both buttons toward center-bottom
  useEffect(() => {
    if (!mounted || locked) {
      if (gravityRAFRef.current != null) { cancelAnimationFrame(gravityRAFRef.current); gravityRAFRef.current = null; }
      return;
    }
    const tick = () => {
      if (lockedRef.current) { gravityRAFRef.current = null; return; }
      if (dragRef.current.id == null) {
        const rails = getRails();
        const target = { x: rails.centerX, y: rails.maxY };
        let anyMoved = false;
        for (const cid of (['dreams', 'system'] as ControlId[])) {
          const curr = posRef.current[cid];
          const dx = target.x - curr.x;
          const dy = target.y - curr.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.5) {
            const speed = Math.max(0.2, dist * 0.004);
            posRef.current[cid] = {
              x: curr.x + (dx / dist) * Math.min(speed, dist),
              y: curr.y + (dy / dist) * Math.min(speed, dist),
            };
            applyPos(cid);
            anyMoved = true;
          }
        }
        if (anyMoved) checkMagnet();
      }
      gravityRAFRef.current = requestAnimationFrame(tick);
    };
    gravityRAFRef.current = requestAnimationFrame(tick);
    return () => {
      if (gravityRAFRef.current != null) { cancelAnimationFrame(gravityRAFRef.current); gravityRAFRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, mounted]);

  const handleTap = (id: ControlId) => {
    const now = performance.now();
    const isDouble = tapRef.current.id === id && now - tapRef.current.at < DOUBLE_TAP_MS;
    tapRef.current.id = id;
    tapRef.current.at = now;
    if (tapRef.current.timer) { clearTimeout(tapRef.current.timer); tapRef.current.timer = null; }

    if (isDouble) {
      if (lockedRef.current) {
        // Double tap while locked → enter NAV MODE (req 11)
        snapToSavedCorners();
        dismissHint();
        // Show "NAV mode" indicator briefly (req 12)
        setShowNavMode(true);
        navModeTimerRef.current = setTimeout(() => {
          setShowNavMode(false);
          navModeTimerRef.current = null;
        }, 2000);
      } else {
        // Double tap in NAV MODE → return to LOCKED HOME MODE (req 41)
        lockToCenter();
        dismissNavMode();
      }
      return;
    }

    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      if (lockedRef.current) {
        // Single tap while locked → Go Home (req 8)
        onHome();
      } else {
        // Single tap in NAV MODE → open specific menu (req 21-22)
        if (id === 'dreams') onOpenDreamsMenu();
        else onOpenSystemMenu();
      }
    }, DOUBLE_TAP_MS + 10);
  };

  const onPointerDown = (id: ControlId) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id,
      startClient: { x: e.clientX, y: e.clientY },
      startPos: {
        dreams: { ...posRef.current.dreams },
        system: { ...posRef.current.system },
      },
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.id) return;
    const rails = getRails();
    const dx = e.clientX - drag.startClient.x;
    const dy = e.clientY - drag.startClient.y;
    if (!drag.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) drag.moved = true;
    if (!drag.moved) return;

    if (lockedRef.current) {
      // Locked: both buttons move together (vertical only)
      const y = Math.min(Math.max(drag.startPos.dreams.y + dy, rails.minY), rails.maxY);
      posRef.current.dreams = { x: rails.centerX, y };
      posRef.current.system = { x: rails.centerX, y };
      applyPos('dreams');
      applyPos('system');
      return;
    }

    // Unlocked: button slides along its rail (vertical only)
    const y = Math.min(Math.max(drag.startPos[drag.id].y + dy, rails.minY), rails.maxY);
    if (drag.id === 'dreams') posRef.current.dreams = { x: rails.rightX, y };
    else posRef.current.system = { x: rails.leftX, y };
    applyPos(drag.id);
    checkMagnet();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.id) return;
    const id = drag.id;
    dragRef.current.id = null;
    if (!drag.moved) {
      handleTap(id);
    } else if (!lockedRef.current) {
      // Persist positions on drag end (req 68)
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
      {/* "Double tap to unlock" hint — non-blocking, once per session (req 3-5) */}
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
            pointerEvents: 'none', // req 4
          }}
        >
          Double-tap to unlock
        </div>
      )}

      {/* "NAV mode" indicator — brief, non-blocking (req 12-13) */}
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
            pointerEvents: 'none', // req 13
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

      {/* Dreams button (right rail when unlocked, center when locked) */}
      <button
        ref={(el) => { elRef.current.dreams = el; }}
        type="button"
        aria-label={locked ? 'Go Home (double-tap to unlock NAV mode)' : 'Open Daydreams menu'}
        style={{
          ...baseStyle,
          background: locked
            ? 'linear-gradient(135deg,#0369a1,#0ea5e9)'
            : 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
          border: locked ? '2px solid #0ea5e9' : '1px solid rgba(255,255,255,0.3)',
          boxShadow: locked
            ? '0 0 0 2px #c8981a, 0 0 28px rgba(14,165,233,0.5)'
            : '0 4px 18px rgba(14,165,233,0.5)',
        }}
        onPointerDown={onPointerDown('dreams')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current.id = null; }}
      >
        <InfinityHalf side="left" />
      </button>

      {/* System button (left rail when unlocked, center when locked) */}
      <button
        ref={(el) => { elRef.current.system = el; }}
        type="button"
        aria-label={locked ? 'Go Home (double-tap to unlock NAV mode)' : 'Open System menu'}
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
        onPointerDown={onPointerDown('system')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current.id = null; }}
      >
        <InfinityHalf side="right" />
      </button>
    </div>
  );
}
