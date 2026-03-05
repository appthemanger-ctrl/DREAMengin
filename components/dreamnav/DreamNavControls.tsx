'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type ControlId = 'dreams' | 'system';
type Props = {
  onHome: () => void;
  onOpenDreamsMenu: () => void;
  onOpenSystemMenu: () => void;
  onOpenBothMenus: () => void;
  onLockChange?: (locked: boolean) => void;
  /** When true (b-side), show two separate buttons instead of one gold */
  bSide?: boolean;
};

type Pos = { x: number; y: number };

const CTRL_SIZE = 54;
const RAIL_WIDTH = 0.13;
const SAFE_EDGE_PX = 28;
const SNAP_DISTANCE = 88;
const LOCK_HYSTERESIS = 56;
const STORAGE_KEY = 'dreamengin:controls:v4';
const DOUBLE_TAP_MS = 280;
const SNAP_ANIM_MS = 180;

/** Shown only once per login session. */
let hintShownThisSession = false;

/** Full infinity mark SVG — used on the single gold home button */
function InfinityMark({ color = '#c8981a', size = 30 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 120 54" style={{ opacity: 0.95 }}>
      {/* left lobe */}
      <path
        d="M60 27 C60 12 40 4 24 12 C10 19 10 35 24 42 C40 50 60 42 60 27Z"
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* right lobe */}
      <path
        d="M60 27 C60 12 80 4 96 12 C110 19 110 35 96 42 C80 50 60 42 60 27Z"
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Half-infinity for the split two-button b-side mode */
function InfinityHalf({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  const color = side === 'left' ? '#2a8ab8' : '#c8981a';
  return (
    <svg width="26" height="13" viewBox="0 0 80 36" style={{ opacity: 0.92 }}>
      <g transform={flip ? 'translate(80,0) scale(-1,1)' : undefined}>
        <path d="M10 18c8-10 18-10 28 0s20 10 28 0" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
        <path d="M10 18c8 10 18 10 28 0s20-10 28 0" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

export default function DreamNavControls({
  onHome, onOpenDreamsMenu, onOpenSystemMenu, onOpenBothMenus, onLockChange, bSide = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [locked, setLocked] = useState(true);
  const lockedRef = useRef(true);
  const [showHint, setShowHint] = useState(false);
  const [showNavMode, setShowNavMode] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gravityRAFRef = useRef<number | null>(null);

  const posRef = useRef<Record<ControlId, Pos>>({ dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } });
  const savedPosRef = useRef<Record<ControlId, Pos>>({ dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } });
  const elRef = useRef<Record<ControlId, HTMLButtonElement | null>>({ dreams: null, system: null });
  const goldRef = useRef<HTMLButtonElement | null>(null);
  const goldPosRef = useRef<Pos>({ x: 0, y: 0 });
  const dragRef = useRef<{
    id: ControlId | 'gold' | null;
    startClient: { x: number; y: number };
    startPos: Pos;
    moved: boolean;
  }>({ id: null, startClient: { x: 0, y: 0 }, startPos: { x: 0, y: 0 }, moved: false });
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

  const applyGoldPos = () => {
    const p = goldPosRef.current;
    if (goldRef.current) goldRef.current.style.transform = `translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0)`;
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
    el.animate([{ transform: from }, { transform: to }], { duration: SNAP_ANIM_MS, easing: 'ease-out', fill: 'forwards' });
    el.style.transform = to;
  };

  const snapToSavedCorners = () => {
    const rails = getRails();
    animateTo('dreams', { x: rails.rightX, y: Math.min(Math.max(savedPosRef.current.dreams.y, rails.minY), rails.maxY) });
    animateTo('system', { x: rails.leftX, y: Math.min(Math.max(savedPosRef.current.system.y, rails.minY), rails.maxY) });
    setLockState(false);
  };

  const lockToCenter = () => {
    const rails = getRails();
    savedPosRef.current = { dreams: { ...posRef.current.dreams }, system: { ...posRef.current.system } };
    const midY = Math.round((posRef.current.dreams.y + posRef.current.system.y) / 2);
    const y = Math.min(Math.max(midY, rails.minY), rails.maxY);
    animateTo('dreams', { x: rails.centerX, y });
    animateTo('system', { x: rails.centerX, y });
    // Snap gold button too
    if (goldRef.current) {
      const goldTo = `translate3d(${Math.round(rails.centerX)}px,${Math.round(y)}px,0)`;
      goldPosRef.current = { x: rails.centerX, y };
      goldRef.current.animate(
        [{ transform: goldRef.current.style.transform || goldTo }, { transform: goldTo }],
        { duration: SNAP_ANIM_MS, easing: 'ease-out', fill: 'forwards' }
      );
      goldRef.current.style.transform = goldTo;
    }
    setLockState(true);
  };

  const checkMagnet = () => {
    const a = posRef.current.dreams;
    const b = posRef.current.system;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (!lockedRef.current && dist < SNAP_DISTANCE) lockToCenter();
    else if (lockedRef.current && dist > LOCK_HYSTERESIS) setLockState(false);
  };

  // Init
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
    const lockY = rails.maxY - 48;
    posRef.current.dreams = { x: rails.centerX, y: lockY };
    posRef.current.system = { x: rails.centerX, y: lockY };
    goldPosRef.current = { x: rails.centerX, y: lockY };
    lockedRef.current = true;
    setMounted(true);
    requestAnimationFrame(() => { applyPos('dreams'); applyPos('system'); applyGoldPos(); });

    if (!hintShownThisSession) {
      hintShownThisSession = true;
      hintTimerRef.current = setTimeout(() => {
        setShowHint(true);
        hintTimerRef.current = setTimeout(() => {
          setShowHint(false);
          hintTimerRef.current = null;
        }, 2200);
      }, 500);
    }

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (navModeTimerRef.current) clearTimeout(navModeTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const handler = () => dismissHint();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [showHint, dismissHint]);

  useEffect(() => {
    if (!showNavMode) return;
    const handler = () => dismissNavMode();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [showNavMode, dismissNavMode]);

  // Gravity toward center when unlocked
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
            posRef.current[cid] = { x: curr.x + (dx / dist) * Math.min(speed, dist), y: curr.y + (dy / dist) * Math.min(speed, dist) };
            applyPos(cid);
            anyMoved = true;
          }
        }
        if (anyMoved) checkMagnet();
      }
      gravityRAFRef.current = requestAnimationFrame(tick);
    };
    gravityRAFRef.current = requestAnimationFrame(tick);
    return () => { if (gravityRAFRef.current != null) { cancelAnimationFrame(gravityRAFRef.current); gravityRAFRef.current = null; } };
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
        snapToSavedCorners();
        dismissHint();
        setShowNavMode(true);
        navModeTimerRef.current = setTimeout(() => { setShowNavMode(false); navModeTimerRef.current = null; }, 2000);
      } else {
        if (id === 'dreams') onOpenDreamsMenu();
        else onOpenSystemMenu();
      }
      return;
    }

    tapRef.current.timer = setTimeout(() => {
      tapRef.current.timer = null;
      if (lockedRef.current) onOpenBothMenus();
      else onHome();
    }, DOUBLE_TAP_MS + 10);
  };

  // Gold button tap (home/locked state)
  const goldTapRef = useRef<{ at: number; timer: ReturnType<typeof setTimeout> | null }>({ at: 0, timer: null });
  const handleGoldTap = () => {
    const now = performance.now();
    const isDouble = now - goldTapRef.current.at < DOUBLE_TAP_MS;
    goldTapRef.current.at = now;
    if (goldTapRef.current.timer) { clearTimeout(goldTapRef.current.timer); goldTapRef.current.timer = null; }

    if (isDouble) {
      // Double tap gold → unlock to b-side nav mode
      snapToSavedCorners();
      dismissHint();
      setShowNavMode(true);
      navModeTimerRef.current = setTimeout(() => { setShowNavMode(false); navModeTimerRef.current = null; }, 2000);
      return;
    }

    goldTapRef.current.timer = setTimeout(() => {
      goldTapRef.current.timer = null;
      // Single tap gold → open both menus
      onOpenBothMenus();
    }, DOUBLE_TAP_MS + 10);
  };

  // Gold button drag
  const onGoldPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id: 'gold', startClient: { x: e.clientX, y: e.clientY }, startPos: { ...goldPosRef.current }, moved: false };
  };
  const onGoldPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.id !== 'gold') return;
    const rails = getRails();
    const dy = e.clientY - dragRef.current.startClient.y;
    if (!dragRef.current.moved && Math.abs(dy) > 5) dragRef.current.moved = true;
    if (!dragRef.current.moved) return;
    const y = Math.min(Math.max(dragRef.current.startPos.y + dy, rails.minY), rails.maxY);
    goldPosRef.current = { x: rails.centerX, y };
    posRef.current.dreams = { x: rails.centerX, y };
    posRef.current.system = { x: rails.centerX, y };
    applyGoldPos();
  };
  const onGoldPointerUp = () => {
    if (dragRef.current.id !== 'gold') return;
    const moved = dragRef.current.moved;
    dragRef.current.id = null;
    if (!moved) {
      handleGoldTap();
    } else {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current)); } catch { /* noop */ }
    }
  };

  // Split-button drag (b-side / unlocked)
  const onPointerDown = (id: ControlId) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id, startClient: { x: e.clientX, y: e.clientY }, startPos: { ...posRef.current[id] }, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.id || drag.id === 'gold') return;
    const rails = getRails();
    const dy = e.clientY - drag.startClient.y;
    if (!drag.moved && Math.abs(dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    const y = Math.min(Math.max(drag.startPos.y + dy, rails.minY), rails.maxY);
    if (drag.id === 'dreams') posRef.current.dreams = { x: rails.rightX, y };
    else posRef.current.system = { x: rails.leftX, y };
    applyPos(drag.id as ControlId);
    checkMagnet();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.id || drag.id === 'gold') return;
    const id = drag.id as ControlId;
    dragRef.current.id = null;
    if (!drag.moved) handleTap(id);
    else if (!lockedRef.current) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current)); } catch { /* noop */ }
    }
  };

  if (!mounted) return null;

  const baseStyle: React.CSSProperties = {
    position: 'fixed', left: 0, top: 0,
    width: CTRL_SIZE, height: CTRL_SIZE,
    borderRadius: 9999, touchAction: 'none', pointerEvents: 'auto',
    zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  };

  // ── B-SIDE: two separate buttons ──────────────────────────────────────
  if (bSide && !locked) {
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 58 }}>
        {/* Small go-back arrow — top-left (SPEC §35) */}
        <button
          type="button"
          onClick={onHome}
          aria-label="Go back to Home"
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 65, pointerEvents: 'auto',
            background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(160,195,240,0.45)',
            borderRadius: 9999, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          ←
        </button>

        {/* Dreams button — right rail (blue) */}
        <button
          ref={(el) => { elRef.current.dreams = el; }}
          type="button"
          aria-label="Daydreams menu · Double-tap to open"
          style={{
            ...baseStyle,
            background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 4px 20px rgba(14,165,233,0.45)',
          }}
          onPointerDown={onPointerDown('dreams')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { dragRef.current.id = null; }}
        >
          <InfinityHalf side="left" />
        </button>

        {/* System button — left rail (gold) */}
        <button
          ref={(el) => { elRef.current.system = el; }}
          type="button"
          aria-label="System menu · Double-tap to open"
          style={{
            ...baseStyle,
            background: 'linear-gradient(135deg,#a16207,#c8981a)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 4px 20px rgba(200,152,26,0.45)',
          }}
          onPointerDown={onPointerDown('system')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { dragRef.current.id = null; }}
        >
          <InfinityHalf side="right" />
        </button>

        {/* NAV mode indicator */}
        {showNavMode && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 65, display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 16px', borderRadius: 9999,
            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(160,195,240,0.45)',
            color: 'var(--de-text-dim)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase', pointerEvents: 'none',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--de-gold, #c8981a)', flexShrink: 0 }} />
            B-Side
          </div>
        )}
      </div>
    );
  }

  // ── HOME / LOCKED: ONE GOLD BUTTON ────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 58 }}>
      {/* "Tap for menus · Double-tap to unlock" hint — once per session */}
      {locked && showHint && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 61, padding: '5px 14px', borderRadius: 9999,
          background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(200,152,26,0.35)',
          color: 'var(--de-gold, #c8981a)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', pointerEvents: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          Tap for menus · Double-tap to unlock
        </div>
      )}

      {/* NAV mode indicator */}
      {showNavMode && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 65, display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 16px', borderRadius: 9999,
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(160,195,240,0.45)',
          color: 'var(--de-text-dim)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase', pointerEvents: 'none',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--de-gold, #c8981a)', flexShrink: 0 }} />
          NAV Mode
        </div>
      )}

      {/* THE ONE GOLD BUTTON — home anchor */}
      <button
        ref={goldRef}
        type="button"
        aria-label="Open menus · Double-tap to unlock"
        style={{
          ...baseStyle,
          width: CTRL_SIZE + 4,
          height: CTRL_SIZE + 4,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.72), rgba(255,255,255,0.45))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(200,152,26,0.55)',
          boxShadow: [
            '0 0 0 2.5px rgba(200,152,26,0.22)',
            '0 6px 32px rgba(200,152,26,0.28)',
            'inset 0 1px 0 rgba(255,255,255,0.85)',
          ].join(', '),
          transition: 'box-shadow 0.2s, transform 0.15s',
        }}
        onPointerDown={onGoldPointerDown}
        onPointerMove={onGoldPointerMove}
        onPointerUp={onGoldPointerUp}
        onPointerCancel={() => { dragRef.current.id = null; }}
      >
        <InfinityMark color="var(--de-gold, #c8981a)" size={28} />
      </button>
    </div>
  );
}
