'use client';

import React, { useEffect, useRef, useState } from 'react';

type ControlId = 'dreams' | 'system';
type Props = {
  onHome: () => void;
  onOpenDreamsMenu: () => void;
  onOpenSystemMenu: () => void;
};

type Pos = { x: number; y: number };

const CTRL_SIZE = 52;
const RAIL_WIDTH = 0.14;
const SNAP_DISTANCE = 92;
const LOCK_DISTANCE = 44;
const STORAGE_KEY = 'dreamengin:controls:v3';

export default function DreamNavControls({ onHome, onOpenDreamsMenu, onOpenSystemMenu }: Props) {
  const [mounted, setMounted] = useState(false);
  const [navLocked, setNavLocked] = useState(false);
  const [hint, setHint] = useState<{ text: string; x: number; y: number } | null>(null);

  const posRef = useRef<Record<ControlId, Pos>>({ dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } });
  const elRef = useRef<Record<ControlId, HTMLButtonElement | null>>({ dreams: null, system: null });
  const dragRef = useRef<{ id: ControlId | null; startY: number; startPos: Record<ControlId, Pos>; moved: boolean }>({ id: null, startY: 0, startPos: { dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } }, moved: false });
  const tapRef = useRef<{ id: ControlId | null; at: number; timer: number | null }>({ id: null, at: 0, timer: null });

  const getRails = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rail = w * RAIL_WIDTH;
    return {
      leftX: Math.round((rail - CTRL_SIZE) / 2),
      rightX: Math.round(w - rail + (rail - CTRL_SIZE) / 2),
      minY: 48,
      maxY: h - CTRL_SIZE - 24,
      centerX: Math.round((w - CTRL_SIZE) / 2),
    };
  };

  const apply = (id: ControlId) => {
    const p = posRef.current[id];
    const el = elRef.current[id];
    if (el) el.style.transform = `translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0)`;
  };

  const setWindowLock = (locked: boolean) => {
    (window as Window & { __deNavLocked?: boolean }).__deNavLocked = locked;
    setNavLocked(locked);
  };

  const separateToRails = () => {
    const rails = getRails();
    const midY = Math.round((posRef.current.dreams.y + posRef.current.system.y) / 2);
    posRef.current.dreams = { x: rails.rightX, y: Math.min(Math.max(midY, rails.minY), rails.maxY) };
    posRef.current.system = { x: rails.leftX, y: Math.min(Math.max(midY, rails.minY), rails.maxY) };
    apply('dreams');
    apply('system');
    setWindowLock(false);
  };

  const lockToMiddle = () => {
    const rails = getRails();
    const y = Math.min(Math.max(Math.round((posRef.current.dreams.y + posRef.current.system.y) / 2), rails.minY), rails.maxY);
    posRef.current.dreams = { x: rails.centerX, y };
    posRef.current.system = { x: rails.centerX, y };
    const opts: KeyframeAnimationOptions = { duration: 170, easing: 'ease-out', fill: 'forwards' };
    elRef.current.dreams?.animate([{ transform: elRef.current.dreams.style.transform }, { transform: `translate3d(${rails.centerX}px,${y}px,0)` }], opts);
    elRef.current.system?.animate([{ transform: elRef.current.system.style.transform }, { transform: `translate3d(${rails.centerX}px,${y}px,0)` }], opts);
    apply('dreams');
    apply('system');
    setWindowLock(true);
  };

  const evaluateLock = () => {
    const a = posRef.current.dreams;
    const b = posRef.current.system;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (!navLocked && dist < SNAP_DISTANCE) lockToMiddle();
    else if (navLocked && dist > LOCK_DISTANCE) setWindowLock(false);
  };

  useEffect(() => {
    const rails = getRails();
    const defaultPos = {
      dreams: { x: rails.rightX, y: rails.maxY - 48 },
      system: { x: rails.leftX, y: rails.maxY - 48 },
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<ControlId, Pos>;
        posRef.current.dreams = { x: rails.rightX, y: Math.min(Math.max(parsed.dreams.y, rails.minY), rails.maxY) };
        posRef.current.system = { x: rails.leftX, y: Math.min(Math.max(parsed.system.y, rails.minY), rails.maxY) };
      } else {
        posRef.current = defaultPos;
      }
    } catch {
      posRef.current = defaultPos;
    }
    setMounted(true);
    requestAnimationFrame(() => {
      apply('dreams');
      apply('system');
      setWindowLock(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (id: ControlId) => {
    const now = performance.now();
    const isDouble = tapRef.current.id === id && now - tapRef.current.at < 280;
    tapRef.current.id = id;
    tapRef.current.at = now;

    if (tapRef.current.timer) window.clearTimeout(tapRef.current.timer);

    if (isDouble) {
      tapRef.current.timer = null;
      setHint(null);
      if (navLocked) {
        separateToRails();
      } else if (id === 'dreams') {
        onOpenDreamsMenu();
      } else {
        onOpenSystemMenu();
      }
      return;
    }

    // AXIOM-friendly discoverability: first tap shows an anchored "tap again" hint.
    try {
      const rect = elRef.current[id]?.getBoundingClientRect();
      if (rect) {
        setHint({
          text: id === 'dreams' ? 'Tap again: Dreams menu' : 'Tap again: System menu',
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        window.setTimeout(() => setHint(null), 900);
      }
    } catch {
      // ignore hint failures
    }

    tapRef.current.timer = window.setTimeout(() => {
      setHint(null);
      if (navLocked) {
        if (id === 'dreams') onOpenDreamsMenu();
        else onOpenSystemMenu();
      } else {
        onHome();
      }
    }, 240);
  };

  const onPointerDown = (id: ControlId) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id,
      startY: e.clientY,
      startPos: { dreams: { ...posRef.current.dreams }, system: { ...posRef.current.system } },
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.id) return;
    const rails = getRails();
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dy) > 4) drag.moved = true;

    if (navLocked) {
      const y = Math.min(Math.max(drag.startPos.dreams.y + dy, rails.minY), rails.maxY);
      posRef.current.dreams = { x: rails.centerX, y };
      posRef.current.system = { x: rails.centerX, y };
      apply('dreams');
      apply('system');
      return;
    }

    const y = Math.min(Math.max(drag.startPos[drag.id].y + dy, rails.minY), rails.maxY);
    if (drag.id === 'dreams') posRef.current.dreams = { x: rails.rightX, y };
    else posRef.current.system = { x: rails.leftX, y };
    apply(drag.id);
    evaluateLock();
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag.id) return;
    const id = drag.id;
    if (!drag.moved) handleTap(id);
    dragRef.current.id = null;
    if (!navLocked) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current)); } catch { /* ignore */ }
    }
  };

  if (!mounted) return null;

  const base: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    borderRadius: '999px',
    border: navLocked ? '2px solid var(--de-gold)' : '1px solid rgba(255,255,255,0.22)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    touchAction: 'none',
    pointerEvents: 'auto',
    zIndex: 60,
  };

  return (
    <div className="controls" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 58 }}>
      {hint ? (
        <div
          style={{
            position: 'fixed',
            left: hint.x,
            top: hint.y,
            transform: 'translate(-50%,-100%)',
            padding: '8px 10px',
            borderRadius: 12,
            background: 'rgba(2,8,24,0.72)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 12,
            letterSpacing: '0.02em',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 61,
          }}
        >
          {hint.text}
        </div>
      ) : null}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: `${RAIL_WIDTH * 100}%`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: `${RAIL_WIDTH * 100}%`, pointerEvents: 'none' }} />

      <button
        ref={(el) => { elRef.current.dreams = el; }}
        type="button"
        aria-label="Dream controls"
        style={{
          ...base,
          background: navLocked ? 'linear-gradient(135deg,#7c5b1a,#d4a843)' : 'linear-gradient(135deg,#1d4ed8,#2563eb)',
          boxShadow: navLocked ? '0 0 24px rgba(212,168,67,.7)' : '0 0 18px rgba(37,99,235,.65)',
        }}
        onPointerDown={onPointerDown('dreams')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      <button
        ref={(el) => { elRef.current.system = el; }}
        type="button"
        aria-label="System controls"
        style={{
          ...base,
          background: navLocked ? 'linear-gradient(135deg,#7c5b1a,#d4a843)' : 'linear-gradient(135deg,#7f1d1d,#ef4444)',
          boxShadow: navLocked ? '0 0 24px rgba(212,168,67,.7)' : '0 0 18px rgba(239,68,68,.65)',
        }}
        onPointerDown={onPointerDown('system')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
