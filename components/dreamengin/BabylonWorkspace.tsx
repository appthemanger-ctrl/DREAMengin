// components/dreamengin/BabylonWorkspace.tsx
// Deterministic toroidal navigation workspace (Babylon placeholder).
// The render loop updates transforms without React re-renders.

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, wrap, unitComplexRotate } from './engine/math';
import type { EngineState } from './engine/types';

interface BabylonWorkspaceProps {
  engineRef: React.MutableRefObject<EngineState>;
  onZoom: (delta: number) => void;
}

// World dimensions in pixels (toroidal domain T²).
const WORLD_W = 6000;
const WORLD_H = 6000;

// Flight tuning (per-frame, fixed-step for determinism).
const FPS = 60;
const DT = 1 / FPS;
const V_BASE = 8;      // px/frame at thrust=0
const V_MAX = 46;      // px/frame
const A_THRUST = 42;   // extra px/frame at thrust=1

export default function BabylonWorkspace({ engineRef, onZoom }: BabylonWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);

  // Debug HUD (low frequency)
  const [hud, setHud] = useState({ x: 0, y: 0, depth: 0, yawDeg: 0, scale: 1, flying: false });

  const tiles = useMemo(() => {
    const out: { left: number; top: number; id: string }[] = [];
    const tileSize = 320;
    for (let ix = 0; ix < 12; ix++) {
      for (let iy = 0; iy < 12; iy++) {
        out.push({ left: ix * tileSize, top: iy * tileSize, id: `${ix}-${iy}` });
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let raf = 0;

    const tick = () => {
      const s = engineRef.current;

      if (!s.overlayLock) {
        // Apply accumulated steer (quantum yaw: q <- q * e^{iΔθ})
        if (s.flight.steerDelta !== 0) {
          unitComplexRotate(s.yawQ, s.flight.steerDelta);
          s.flight.steerDelta = 0;
        }

        // Flight update (fixed step for determinism)
        if (s.flight.active) {
          const speed = clamp(V_BASE + A_THRUST * s.flight.thrust, 0, V_MAX);
          const dirX = s.yawQ[0];
          const dirY = s.yawQ[1];
          const sign = s.flight.mode === 'out' ? -1 : 1;

          // Deterministic motion, no allocations.
          s.x = wrap(s.x + sign * speed * dirX, WORLD_W);
          s.y = wrap(s.y + sign * speed * dirY, WORLD_H);
        }
      }

      // Render world transform (camera is implicit; world moves).
      const world = worldRef.current;
      if (world) {
        // Translate negative to simulate camera moving through world.
        world.style.transform = `translate3d(${-s.x}px, ${-s.y}px, 0) scale(${s.scale})`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engineRef]);

  // Pointer drag to pan when not flying and not overlay-locked.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let activePointer: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      const s = engineRef.current;
      if (s.overlayLock || s.flight.active) return;
      if (e.button !== 0) return;
      activePointer = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (activePointer === null || e.pointerId !== activePointer) return;
      const s = engineRef.current;
      if (s.overlayLock || s.flight.active) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      // Dragging the surface: move camera by inverse delta.
      s.x = wrap(s.x - dx, WORLD_W);
      s.y = wrap(s.y - dy, WORLD_H);
    };

    const onUp = (e: PointerEvent) => {
      if (activePointer !== null && e.pointerId === activePointer) {
        activePointer = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      const s = engineRef.current;
      if (s.overlayLock) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      onZoom(delta);
    };

    el.addEventListener('pointerdown', onDown, { passive: true });
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerup', onUp, { passive: true });
    el.addEventListener('pointercancel', onUp, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [engineRef, onZoom]);

  // HUD refresh
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = engineRef.current;
      const yawDeg = (Math.atan2(s.yawQ[1], s.yawQ[0]) * 180) / Math.PI;
      setHud({
        x: Math.round(s.x),
        y: Math.round(s.y),
        depth: s.depth,
        yawDeg: Math.round(yawDeg),
        scale: Math.round(s.scale * 100) / 100,
        flying: s.flight.active,
      });
    }, 200);
    return () => window.clearInterval(id);
  }, [engineRef]);

  return (
    <div ref={rootRef} className="absolute inset-0 bg-black overflow-hidden touch-none">
      <div ref={worldRef} className="absolute left-0 top-0 will-change-transform">
        {tiles.map((t) => (
          <div
            key={t.id}
            className="absolute w-[300px] h-[300px] border border-white/15 text-white/30 flex items-center justify-center select-none"
            style={{ left: t.left, top: t.top }}
          >
            {t.id}
          </div>
        ))}
      </div>

      <div className="absolute top-3 left-3 text-xs text-white/70 bg-black/40 px-2 py-1 rounded select-none pointer-events-none">
        x:{hud.x} y:{hud.y} depth:{hud.depth} yaw:{hud.yawDeg}° scale:{hud.scale} {hud.flying ? 'FLY' : ''}
      </div>
    </div>
  );
}
