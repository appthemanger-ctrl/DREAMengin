'use client';

import React, { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };
type ControlId = 'dreams' | 'system';

type Props = {
  onHome: () => void;
  onOpenDreamsMenu: () => void;
  onOpenSystemMenu: () => void;
  onDepthIn?: () => void;
  onDepthOut?: () => void;
};

const CTRL_SIZE = 52;
const CTRL_MARGIN = 16;
const CTRL_GAP = 14;
const STORAGE_KEY = 'dreamengin:controls:v2';

export default function DreamNavControls({
  onHome, onOpenDreamsMenu, onOpenSystemMenu, onDepthIn, onDepthOut,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [navLocked, setNavLocked] = useState(false);

  const posRef = useRef<Record<ControlId, Point>>({ dreams: { x: 0, y: 0 }, system: { x: 0, y: 0 } });
  const elRef  = useRef<Record<ControlId, HTMLButtonElement | null>>({ dreams: null, system: null });
  const drag   = useRef<{
    id: ControlId | null; startPtr: Point; startPos: Point;
    moved: boolean; raf: number | null; holdTimer: number | null; holdArmed: boolean;
    mode: 'move' | 'depth'; lastDepthFired: 'none' | 'in' | 'out';
  }>({ id: null, startPtr: { x: 0, y: 0 }, startPos: { x: 0, y: 0 }, moved: false, raf: null, holdTimer: null, holdArmed: false, mode: 'move', lastDepthFired: 'none' });
  const startBothRef = useRef<Record<ControlId, Point> | null>(null);
  const lastTap = useRef<Record<ControlId, { t: number; x: number; y: number }>>({ dreams: { t: 0, x: 0, y: 0 }, system: { t: 0, x: 0, y: 0 } });

  const applyCtrl = (id: ControlId) => {
    const el = elRef.current[id];
    if (!el) return;
    const p = posRef.current[id];
    el.style.transform = `translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0)`;
  };

  const checkOverlap = () => {
    const a = posRef.current.dreams, b = posRef.current.system;
    const dist = Math.hypot(a.x + CTRL_SIZE / 2 - (b.x + CTRL_SIZE / 2), a.y + CTRL_SIZE / 2 - (b.y + CTRL_SIZE / 2));
    setNavLocked(dist < 36);
    // expose to gesture system via window flag
    (window as any).__deNavLocked = dist < 36;
  };

  useEffect(() => {
    const w = window.innerWidth, h = window.innerHeight;
    const cx = Math.round(w / 2);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<ControlId, Point>;
        if (parsed?.dreams && parsed?.system) { posRef.current = parsed; }
      } else {
        posRef.current.dreams = { x: cx - CTRL_GAP - CTRL_SIZE, y: h - CTRL_SIZE - CTRL_MARGIN };
        posRef.current.system = { x: cx + CTRL_GAP, y: h - CTRL_SIZE - CTRL_MARGIN };
      }
    } catch {
      posRef.current.dreams = { x: cx - CTRL_GAP - CTRL_SIZE, y: h - CTRL_SIZE - CTRL_MARGIN };
      posRef.current.system = { x: cx + CTRL_GAP, y: h - CTRL_SIZE - CTRL_MARGIN };
    }
    setMounted(true);
    requestAnimationFrame(() => { applyCtrl('dreams'); applyCtrl('system'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (id: ControlId, x: number, y: number) => {
    const now = performance.now();
    const prev = lastTap.current[id];
    const dt = now - prev.t;
    const near = Math.hypot(x - prev.x, y - prev.y) < 18;
    lastTap.current[id] = { t: now, x, y };
    if (dt < 260 && near) {
      if (id === 'dreams') onOpenDreamsMenu();
      else onOpenSystemMenu();
    }
    // single tap reserved
  };

  const onPointerDown = (id: ControlId) => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current.id = id;
    drag.current.startPtr = { x: e.clientX, y: e.clientY };
    drag.current.startPos = { ...posRef.current[id] };
    drag.current.moved = false;
    startBothRef.current = { dreams: { ...posRef.current.dreams }, system: { ...posRef.current.system } };
    if (drag.current.holdTimer) window.clearTimeout(drag.current.holdTimer);
    drag.current.holdArmed = false;
    drag.current.mode = 'move';
    drag.current.lastDepthFired = 'none';
    drag.current.holdTimer = window.setTimeout(() => {
      if (!drag.current.moved && drag.current.id === id) drag.current.holdArmed = true;
    }, 140);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const id = drag.current.id;
    if (!id) return;
    const dx = e.clientX - drag.current.startPtr.x;
    const dy = e.clientY - drag.current.startPtr.y;
    if (!drag.current.moved && Math.hypot(dx, dy) > 7) drag.current.moved = true;
    if (drag.current.holdArmed && Math.abs(dy) > Math.abs(dx) * 1.2) {
      drag.current.mode = 'depth';
      posRef.current[id] = { ...drag.current.startPos };
      if (id === 'dreams' && dy < -64 && drag.current.lastDepthFired !== 'in') {
        drag.current.lastDepthFired = 'in'; onDepthIn?.();
      }
      if (id === 'system' && dy > 64 && drag.current.lastDepthFired !== 'out') {
        drag.current.lastDepthFired = 'out'; onDepthOut?.();
      }
    } else {
      drag.current.mode = 'move';
      posRef.current[id] = { x: drag.current.startPos.x + dx, y: drag.current.startPos.y + dy };
    }
    if (drag.current.raf == null) {
      drag.current.raf = requestAnimationFrame(() => { drag.current.raf = null; applyCtrl(id); checkOverlap(); });
    }
    // collision → Return Home
    if (drag.current.mode === 'move' && startBothRef.current) {
      const a = posRef.current.dreams, b = posRef.current.system;
      const dist = Math.hypot(a.x + CTRL_SIZE / 2 - (b.x + CTRL_SIZE / 2), a.y + CTRL_SIZE / 2 - (b.y + CTRL_SIZE / 2));
      if (dist < 34) {
        posRef.current.dreams = { ...startBothRef.current.dreams };
        posRef.current.system = { ...startBothRef.current.system };
        applyCtrl('dreams'); applyCtrl('system');
        onHome();
        drag.current.id = null; drag.current.moved = false;
        if (drag.current.holdTimer) window.clearTimeout(drag.current.holdTimer);
        drag.current.holdTimer = null; drag.current.holdArmed = false;
        startBothRef.current = null;
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const id = drag.current.id;
    if (!id) return;
    if (drag.current.holdTimer) window.clearTimeout(drag.current.holdTimer);
    drag.current.holdTimer = null;
    const wasDepth = drag.current.mode === 'depth';
    if (wasDepth) {
      posRef.current[id] = { ...drag.current.startPos };
      applyCtrl(id);
    } else {
      const w = window.innerWidth, h = window.innerHeight;
      const p = posRef.current[id];
      posRef.current[id] = {
        x: Math.min(Math.max(p.x, CTRL_MARGIN), w - CTRL_SIZE - CTRL_MARGIN),
        y: Math.min(Math.max(p.y, CTRL_MARGIN), h - CTRL_SIZE - CTRL_MARGIN),
      };
      applyCtrl(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current)); } catch { /* ignore */ }
    }
    const wasTap = !drag.current.moved;
    drag.current.id = null; drag.current.moved = false;
    drag.current.holdArmed = false; drag.current.mode = 'move';
    drag.current.lastDepthFired = 'none'; startBothRef.current = null;
    if (wasTap) handleTap(id, e.clientX, e.clientY);
  };

  if (!mounted) return null;

  const btnBase: React.CSSProperties = {
    position: 'fixed', left: 0, top: 0,
    width: CTRL_SIZE, height: CTRL_SIZE,
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'none',
    border: '1.5px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    willChange: 'transform',
    transition: 'box-shadow 0.2s',
    color: 'white',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    zIndex: 50,
  };

  const lockStyle: React.CSSProperties = navLocked ? {
    boxShadow: '0 0 0 2px #d4a843, 0 0 28px rgba(212,168,67,0.65)',
    borderColor: '#d4a843',
  } : {};

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
      {/* Blue — Dreams */}
      <button
        ref={(el) => { elRef.current.dreams = el; }}
        type="button"
        aria-label="Dreams"
        style={{
          ...btnBase,
          background: 'linear-gradient(135deg,#1e40af,#1d4ed8)',
          boxShadow: navLocked ? lockStyle.boxShadow : '0 0 24px rgba(29,78,216,0.6), 0 4px 16px rgba(0,0,0,0.4)',
          ...(navLocked ? { borderColor: '#d4a843' } : {}),
          pointerEvents: 'auto',
        }}
        onPointerDown={onPointerDown('dreams')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current.id = null; }}
      >
        D
      </button>

      {/* Red — System */}
      <button
        ref={(el) => { elRef.current.system = el; }}
        type="button"
        aria-label="System"
        style={{
          ...btnBase,
          background: 'linear-gradient(135deg,#991b1b,#dc2626)',
          boxShadow: navLocked ? lockStyle.boxShadow : '0 0 24px rgba(220,38,38,0.6), 0 4px 16px rgba(0,0,0,0.4)',
          ...(navLocked ? { borderColor: '#d4a843' } : {}),
          pointerEvents: 'auto',
        }}
        onPointerDown={onPointerDown('system')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current.id = null; }}
      >
        S
      </button>

      {/* Nav lock badge */}
      {navLocked && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          padding: '5px 14px', borderRadius: 100,
          background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)',
          color: '#d4a843', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          ⚡ Nav Locked
        </div>
      )}
    </div>
  );
}
