'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * HeroSprite – Dr. Eams sprite, always animating.
 *
 * Sheet: /images/HEROSPRITE.png — 4 cols × 6 rows = 24 frames, 208 × 208 px each.
 *
 * Touch / click zones (based on y position relative to canvas height):
 *   head  → top 30 %     → rows 1   (frames 4–7)
 *   scan  → mid 38 %     → rows 2–3 (frames 8–15)
 *   fall  → bottom 32 %  → rows 4–5 (frames 16–23)
 *   idle  → default loop → row 0    (frames 0–3)
 *
 * The animation never stops — it always cycles through the active range.
 * After a reaction the loop returns to idle automatically.
 */

const SPRITE_COLS = 4;
const SPRITE_ROWS = 6;

type Zone = 'idle' | 'head' | 'scan' | 'fall';

/** Inclusive frame [first, last] for each zone */
const RANGES: Record<Zone, readonly [number, number]> = {
  idle: [0,   3],
  head: [4,   7],
  scan: [8,  15],
  fall: [16, 23],
};

const FPS_BY_ZONE: Record<Zone, number> = {
  idle: 8,
  head: 16,   // snappy head-tap
  scan: 10,   // slow scanning pulse
  fall: 13,   // tumble
};

const REACT_MS = 1600; // reaction duration before returning to idle

/** Hit-test: which zone was the pointer in? */
function hitZone(offsetY: number, displayH: number): Zone {
  const rel = offsetY / displayH;
  if (rel < 0.30) return 'head';
  if (rel < 0.68) return 'scan';
  return 'fall';
}

/** Human-readable hint labels shown briefly after a tap */
const ZONE_LABEL: Record<Zone, string> = {
  idle: '',
  head: '👾 head!',
  scan: '🔬 scan!',
  fall: '💫 fall!',
};

type Props = {
  width?: number;
  height?: number;
  className?: string;
};

export default function HeroSprite({
  width  = 224,
  height = 224,
  className = '',
}: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  // shared with the rAF loop — no re-render on every frame
  const zoneRef     = useRef<Zone>('idle');
  const reactUntil  = useRef<number>(0);
  const localFrame  = useRef<number>(0);   // index within current range
  const lastTime    = useRef<number>(0);

  const [hint, setHint] = useState<{ label: string; key: number } | null>(null);

  const triggerZone = useCallback((zone: Zone) => {
    if (zone === 'idle') return;
    zoneRef.current    = zone;
    localFrame.current = 0;
    reactUntil.current = performance.now() + REACT_MS;
    setHint({ label: ZONE_LABEL[zone], key: Date.now() });
    setTimeout(() => setHint(null), REACT_MS - 100);
  }, []);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const y    = e.clientY - rect.top;
    triggerZone(hitZone(y, rect.height));
  }, [triggerZone]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') triggerZone('head');
    if (e.key === ' ')     triggerZone('scan');
  }, [triggerZone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr     = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/images/HEROSPRITE.png';

    let rafId   = 0;
    let stopped = false;

    img.onload = () => {
      const frameW = Math.floor(img.naturalWidth  / SPRITE_COLS);
      const frameH = Math.floor(img.naturalHeight / SPRITE_ROWS);

      function drawFrame(f: number) {
        if (!ctx) return;
        const col = f % SPRITE_COLS;
        const row = Math.floor(f / SPRITE_COLS);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, width, height);
      }

      function tick(now: number) {
        if (stopped) return;

        // expire reaction → return to idle
        if (zoneRef.current !== 'idle' && now >= reactUntil.current) {
          zoneRef.current    = 'idle';
          localFrame.current = 0;
          lastTime.current   = now;
        }

        const zone             = zoneRef.current;
        const [first, last]    = RANGES[zone];
        const rangeLen         = last - first + 1;
        const frameMs          = 1000 / FPS_BY_ZONE[zone];

        // always advance — even if tab is hidden keep state consistent
        if (!document.hidden && now - lastTime.current >= frameMs) {
          drawFrame(first + (localFrame.current % rangeLen));
          localFrame.current = (localFrame.current + 1) % rangeLen;
          lastTime.current   = now;
        }

        rafId = requestAnimationFrame(tick);
      }

      // draw first frame immediately so canvas is never blank
      drawFrame(RANGES['idle'][0]);
      rafId = requestAnimationFrame(tick);
    };

    img.onerror = () => { stopped = true; };

    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [width, height]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width, height }}>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width,
          height,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
          display: 'block',
        }}
        aria-label="Dr. Eams — tap head, belly, or feet to interact"
        role="img"
        tabIndex={0}
        onPointerDown={handlePointer}
        onKeyDown={handleKey}
      />
      {hint && (
        <div
          key={hint.key}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none',
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            background: 'rgba(10,30,80,0.72)',
            border: '1px solid rgba(90,200,250,0.4)',
            borderRadius: 999,
            padding: '3px 10px',
            whiteSpace: 'nowrap',
            animation: 'de-fade-up 0.25s ease forwards',
          }}
        >
          {hint.label}
        </div>
      )}
    </div>
  );
}
