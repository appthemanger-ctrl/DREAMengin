'use client';

/**
 * DreamBeatCanvas — ambient waveform visualizer for the DaydreamPulseStrip footer.
 *
 * Renders a synchronized multi-frequency sine composite (one wave per Daydream surface)
 * that breathes slowly — a living EKG of the platform's creative pulse.
 *
 * Performance: single rAF loop, canvas-only, no DOM reflows.
 * Battery-safe: pauses on tab-hidden and respects prefers-reduced-motion.
 */

import { useEffect, useRef } from 'react';

// One wave per Daydream surface
const WAVES = [
  { freq: 0.82, amp: 0.42, phase: 0.00, r: 139, g:  92, b: 246 }, // music   — purple
  { freq: 1.10, amp: 0.55, phase: 1.10, r:  34, g: 197, b:  94 }, // games   — green
  { freq: 0.65, amp: 0.38, phase: 2.20, r:   6, g: 182, b: 212 }, // lab     — cyan
  { freq: 1.40, amp: 0.50, phase: 3.30, r:  59, g: 130, b: 246 }, // code    — blue
  { freq: 0.95, amp: 0.46, phase: 4.40, r: 249, g: 115, b:  22 }, // brand   — orange
  { freq: 1.25, amp: 0.52, phase: 5.50, r: 236, g:  72, b: 153 }, // create  — pink
  { freq: 0.72, amp: 0.36, phase: 0.80, r:  99, g: 102, b: 241 }, // analytics — indigo
];

interface DreamBeatCanvasProps {
  height?: number;
}

export default function DreamBeatCanvas({ height = 36 }: DreamBeatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const lastRef   = useRef<number>(0);
  const tRef      = useRef<number>(0);

  useEffect(() => {
    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const setSize = () => {
      const w = canvas.parentElement?.clientWidth ?? 300;
      canvas.width  = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${height}px`;
    };
    setSize();

    const ro = new ResizeObserver(setSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    function render(ts: number) {
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      tRef.current += dt;
      const t = tRef.current;

      const ctx = canvas!.getContext('2d');
      if (!ctx) return;

      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const midY = h / 2;

      for (const wave of WAVES) {
        ctx.beginPath();

        for (let px = 0; px <= w; px += 2) {
          const nx = px / w; // [0,1]
          const y  = midY + wave.amp * midY *
            Math.sin(nx * wave.freq * Math.PI * 6 + t * wave.freq * 1.8 + wave.phase);

          if (px === 0) ctx.moveTo(px, y);
          else          ctx.lineTo(px, y);
        }

        ctx.strokeStyle = `rgba(${wave.r},${wave.g},${wave.b},0.30)`;
        ctx.lineWidth   = dpr * 1.2;
        ctx.stroke();
      }

      // Composite sum wave in gold
      ctx.beginPath();
      for (let px = 0; px <= w; px += 2) {
        const nx = px / w;
        let sum = 0;
        for (const wave of WAVES) {
          sum += wave.amp * Math.sin(nx * wave.freq * Math.PI * 6 + t * wave.freq * 1.8 + wave.phase);
        }
        const y = midY + (sum / WAVES.length) * midY * 0.72;
        if (px === 0) ctx.moveTo(px, y);
        else          ctx.lineTo(px, y);
      }
      ctx.strokeStyle = 'rgba(200,152,26,0.55)';
      ctx.lineWidth   = dpr * 1.8;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame((ts) => { lastRef.current = ts; render(ts); });

    const onHidden = () => {
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else { lastRef.current = performance.now(); rafRef.current = requestAnimationFrame(render); }
    };
    document.addEventListener('visibilitychange', onHidden);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [height]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        display:       'block',
        width:         '100%',
        height,
        pointerEvents: 'none',
      }}
    />
  );
}
