'use client';

import React, { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };

type ControlId = 'dreams' | 'system';

type Props = {
  onHome: () => void;
  onOpenDreamsMenu: () => void;
  onOpenSystemMenu: () => void;
};

/**
 * Two draggable controls:
 * - BLUE = Dreams
 * - RED  = System
 *
 * Behavior:
 * - drag: reposition
 * - double tap: open menu
 * - single tap: home (reset)
 *
 * Implementation notes:
 * - Drag is imperative (DOM style updates) to avoid per-frame React renders.
 */
export default function DreamNavControls({ onHome, onOpenDreamsMenu, onOpenSystemMenu }: Props) {
  const [mounted, setMounted] = useState(false);

  const posRef = useRef<Record<ControlId, Point>>({
    dreams: { x: 18, y: 0 },
    system: { x: 0, y: 0 },
  });

  const elRef = useRef<Record<ControlId, HTMLButtonElement | null>>({
    dreams: null,
    system: null,
  });

  const drag = useRef<{
    id: ControlId | null;
    startPointer: Point;
    startPos: Point;
    moved: boolean;
    raf: number | null;
  }>({
    id: null,
    startPointer: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    moved: false,
    raf: null,
  });

  const lastTap = useRef<Record<ControlId, { t: number; x: number; y: number }>>({
    dreams: { t: 0, x: 0, y: 0 },
    system: { t: 0, x: 0, y: 0 },
  });

  const apply = (id: ControlId) => {
    const el = elRef.current[id];
    if (!el) return;
    const p = posRef.current[id];
    el.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
  };

  useEffect(() => {
    // Initial placement (iOS-first, bottom corners).
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 54;
    const margin = 18;
    posRef.current.dreams = { x: margin, y: h - size - margin };
    posRef.current.system = { x: w - size - margin, y: h - size - margin };
    setMounted(true);
    requestAnimationFrame(() => {
      apply('dreams');
      apply('system');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (id: ControlId, x: number, y: number) => {
    const now = performance.now();
    const prev = lastTap.current[id];
    const dt = now - prev.t;
    const dx = x - prev.x;
    const dy = y - prev.y;
    const near = Math.hypot(dx, dy) < 18;

    lastTap.current[id] = { t: now, x, y };

    if (dt < 260 && near) {
      if (id === 'dreams') onOpenDreamsMenu();
      else onOpenSystemMenu();
      return;
    }
    onHome();
  };

  const onPointerDown = (id: ControlId) => (e: React.PointerEvent) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    drag.current.id = id;
    drag.current.startPointer = { x: e.clientX, y: e.clientY };
    drag.current.startPos = { ...posRef.current[id] };
    drag.current.moved = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const id = drag.current.id;
    if (!id) return;

    const dx = e.clientX - drag.current.startPointer.x;
    const dy = e.clientY - drag.current.startPointer.y;

    if (!drag.current.moved && Math.hypot(dx, dy) > 7) drag.current.moved = true;

    posRef.current[id] = { x: drag.current.startPos.x + dx, y: drag.current.startPos.y + dy };

    if (drag.current.raf == null) {
      drag.current.raf = requestAnimationFrame(() => {
        drag.current.raf = null;
        apply(id);
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const id = drag.current.id;
    if (!id) return;

    // Clamp into viewport
    const size = 54;
    const margin = 10;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const p = posRef.current[id];
    posRef.current[id] = {
      x: Math.min(Math.max(p.x, margin), w - size - margin),
      y: Math.min(Math.max(p.y, margin), h - size - margin),
    };
    apply(id);

    const wasTap = !drag.current.moved;

    drag.current.id = null;
    drag.current.moved = false;

    if (wasTap) handleTap(id, e.clientX, e.clientY);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      <button
        ref={(el) => {
          elRef.current.dreams = el;
        }}
        type="button"
        aria-label="Dreams"
        className="pointer-events-auto fixed left-0 top-0 h-[54px] w-[54px] rounded-full border border-white/20 bg-blue-500/80 backdrop-blur text-white shadow-sm active:scale-[0.98]"
        onPointerDown={onPointerDown('dreams')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-[10px] font-semibold tracking-[0.2em]">D</span>
      </button>

      <button
        ref={(el) => {
          elRef.current.system = el;
        }}
        type="button"
        aria-label="System"
        className="pointer-events-auto fixed left-0 top-0 h-[54px] w-[54px] rounded-full border border-white/20 bg-red-500/80 backdrop-blur text-white shadow-sm active:scale-[0.98]"
        onPointerDown={onPointerDown('system')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-[10px] font-semibold tracking-[0.2em]">S</span>
      </button>
    </div>
  );
}
