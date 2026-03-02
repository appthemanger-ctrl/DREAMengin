'use client';

import { useEffect, useRef } from 'react';

/**
 * HeroSprite – animates /branding/MainSprite.png on a canvas.
 *
 * Sprite sheet layout: 4 columns × 6 rows = 24 frames, each 208 × 208 px.
 * Uses requestAnimationFrame; pauses automatically when the tab is hidden
 * (respects battery-awareness pattern from DrEamsCanvas).
 */

const COLS = 4;
const ROWS = 6;
const TOTAL_FRAMES = COLS * ROWS; // 24
const FPS = 8;
const FRAME_MS = 1000 / FPS;

type Props = {
  width?: number;
  height?: number;
  className?: string;
};

export default function HeroSprite({
  width = 224,
  height = 224,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Honour device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/branding/MainSprite.png';

    let rafId = 0;
    let frame = 0;
    let lastTime = 0;
    let stopped = false;

    img.onload = () => {
      // Frame dimensions must be calculated inside onload after naturalWidth/Height are set
      const frameW = Math.floor(img.naturalWidth / COLS);
      const frameH = Math.floor(img.naturalHeight / ROWS);

      function drawFrame(f: number) {
        if (!ctx) return;
        const col = f % COLS;
        const row = Math.floor(f / COLS);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          img,
          col * frameW,
          row * frameH,
          frameW,
          frameH,
          0,
          0,
          width,
          height
        );
      }

      function tick(now: number) {
        if (stopped) return;
        if (document.hidden) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        if (now - lastTime >= FRAME_MS) {
          drawFrame(frame);
          frame = (frame + 1) % TOTAL_FRAMES;
          lastTime = now;
        }
        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
    };

    // Fallback: if image fails to load just leave canvas blank
    img.onerror = () => {
      stopped = true;
    };

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
      aria-label="DREAMengin hero animation"
      role="img"
    />
  );
}
