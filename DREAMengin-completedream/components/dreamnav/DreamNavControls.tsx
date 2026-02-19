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
export default function DreamNavControls({
  onHome,
  onOpenDreamsMenu,
  onOpenSystemMenu,
  onDepthIn,
  onDepthOut,
}: Props) {
  const [mounted, setMounted] = useState(false);

  const posRef = useRef<Record<ControlId, Point>>({
    dreams: { x: 18, y: 0 },
    system: { x: 0, y: 0 },
  });

  const startBothRef = useRef<Record<ControlId, Point> | null>(null);

  const storageKey = 'dreamengin:controls:v1';

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
    holdTimer: number | null;
    holdArmed: boolean;
    mode: 'move' | 'depth';
    lastDepthFired: 'none' | 'in' | 'out';
  }>({
    id: null,
    startPointer: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    moved: false,
    raf: null,
    holdTimer: null,
    holdArmed: false,
    mode: 'move',
    lastDepthFired: 'none',
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
    // Initial placement (iOS-first, bottom-center). Restore persisted positions if present.
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 54;
    const margin = 18;
    const gap = 16;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<ControlId, Point>;
        if (parsed?.dreams && parsed?.system) {
          posRef.current = parsed;
        }
      } else {
        const centerX = Math.round(w / 2);
        posRef.current.dreams = { x: centerX - gap - size, y: h - size - margin };
        posRef.current.system = { x: centerX + gap, y: h - size - margin };
      }
    } catch {
      const centerX = Math.round(w / 2);
      posRef.current.dreams = { x: centerX - gap - size, y: h - size - margin };
      posRef.current.system = { x: centerX + gap, y: h - size - margin };
    }

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

    // Double-tap opens menus.
    if (dt < 260 && near) {
      if (id === 'dreams') onOpenDreamsMenu();
      else onOpenSystemMenu();
      return;
    }
    // Single tap intentionally does nothing (reserved).
  };

  const onPointerDown = (id: ControlId) => (e: React.PointerEvent) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    drag.current.id = id;
    drag.current.startPointer = { x: e.clientX, y: e.clientY };
    drag.current.startPos = { ...posRef.current[id] };
    drag.current.moved = false;

    // Remember both positions in case we trigger Return Home collision.
    startBothRef.current = {
      dreams: { ...posRef.current.dreams },
      system: { ...posRef.current.system },
    };

    // Arm a "hold" after a short delay. Once armed, vertical drag becomes depth navigation.
    if (drag.current.holdTimer) window.clearTimeout(drag.current.holdTimer);
    drag.current.holdArmed = false;
    drag.current.mode = 'move';
    drag.current.lastDepthFired = 'none';
    drag.current.holdTimer = window.setTimeout(() => {
      // If the user hasn't started moving, treat subsequent vertical movement as depth.
      if (!drag.current.moved && drag.current.id === id) {
        drag.current.holdArmed = true;
      }
    }, 140);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const id = drag.current.id;
    if (!id) return;

    const dx = e.clientX - drag.current.startPointer.x;
    const dy = e.clientY - drag.current.startPointer.y;

    if (!drag.current.moved && Math.hypot(dx, dy) > 7) drag.current.moved = true;

    // Depth command mode (hold + vertical drag).
    if (drag.current.holdArmed && Math.abs(dy) > Math.abs(dx) * 1.2) {
      drag.current.mode = 'depth';
      // Keep the control in-place while commanding depth.
      posRef.current[id] = { ...drag.current.startPos };

      // Fire at a threshold; keep it simple + deterministic for now.
      if (id === 'dreams' && dy < -64 && drag.current.lastDepthFired !== 'in') {
        drag.current.lastDepthFired = 'in';
        // Blue control: inward.
        onDepthIn?.();
      }
      if (id === 'system' && dy > 64 && drag.current.lastDepthFired !== 'out') {
        drag.current.lastDepthFired = 'out';
        // Red control: outward.
        onDepthOut?.();
      }
    } else {
      drag.current.mode = 'move';
      posRef.current[id] = { x: drag.current.startPos.x + dx, y: drag.current.startPos.y + dy };
    }

    if (drag.current.raf == null) {
      drag.current.raf = requestAnimationFrame(() => {
        drag.current.raf = null;
        apply(id);
      });
    }

    // Return Home collision: drag one control onto the other.
    if (drag.current.mode === 'move' && startBothRef.current) {
      const a = posRef.current.dreams;
      const b = posRef.current.system;
      const size = 54;
      const dist = Math.hypot(a.x + size / 2 - (b.x + size / 2), a.y + size / 2 - (b.y + size / 2));
      if (dist < 34) {
        // Snap both back to their previous positions and return home.
        posRef.current.dreams = { ...startBothRef.current.dreams };
        posRef.current.system = { ...startBothRef.current.system };
        apply('dreams');
        apply('system');
        onHome();

        // End the drag.
        drag.current.id = null;
        drag.current.moved = false;
        if (drag.current.holdTimer) window.clearTimeout(drag.current.holdTimer);
        drag.current.holdTimer = null;
        drag.current.holdArmed = false;
        startBothRef.current = null;
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const id = drag.current.id;
    if (!id) return;

    if (drag.current.holdTimer) window.clearTimeout(drag.current.holdTimer);
    drag.current.holdTimer = null;

    // If we were in depth mode, treat as a command gesture (do not move the controls).
    const wasDepth = drag.current.mode === 'depth';

    if (wasDepth) {
      const dy = e.clientY - drag.current.startPointer.y;
      if (id === 'dreams' && dy < -64) {
        // Blue control: inward.
        // (onDepthIn is optional; caller may not implement depth yet.)
        if (drag.current.lastDepthFired !== 'in') onDepthIn?.();
      }
      if (id === 'system' && dy > 64) {
        // Red control: outward.
        if (drag.current.lastDepthFired !== 'out') onDepthOut?.();
      }
      posRef.current[id] = { ...drag.current.startPos };
      apply(id);
    } else {
      // Clamp into viewport + persist.
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
      try {
        localStorage.setItem(storageKey, JSON.stringify(posRef.current));
      } catch {
        // ignore
      }
    }

    const wasTap = !drag.current.moved;

    drag.current.id = null;
    drag.current.moved = false;
    drag.current.holdArmed = false;
    drag.current.mode = 'move';
    drag.current.lastDepthFired = 'none';
    startBothRef.current = null;

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
        className="pointer-events-auto touch-none fixed left-0 top-0 h-[54px] w-[54px] rounded-full border border-white/20 bg-blue-500/80 backdrop-blur text-white shadow-sm active:scale-[0.98]"
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
        className="pointer-events-auto touch-none fixed left-0 top-0 h-[54px] w-[54px] rounded-full border border-white/20 bg-red-500/80 backdrop-blur text-white shadow-sm active:scale-[0.98]"
        onPointerDown={onPointerDown('system')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-[10px] font-semibold tracking-[0.2em]">S</span>
      </button>
    </div>
  );
}
