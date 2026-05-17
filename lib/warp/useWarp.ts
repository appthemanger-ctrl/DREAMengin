'use client';

/**
 * useWarp — React hook that drives a WarpEngine on an HTML5 Canvas.
 *
 * Usage:
 *   const { canvasRef, isRunning, toggle, setEffect } = useWarp({ effect: 'flow' });
 *   return <canvas ref={canvasRef} />;
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { WarpEngine, WarpEffect, WarpEngineOptions } from './warpEngine';

// Passive 30 fps cap (≈33.33 ms/frame). Keeps the ambient effect smooth
// while ~halving CPU/GPU/battery cost on mobile vs. an uncapped rAF loop.
const FRAME_INTERVAL_MS = 1000 / 30;

export interface UseWarpOptions extends WarpEngineOptions {
  /** Start running immediately. Default: true. */
  autoStart?: boolean;
}

export interface UseWarpReturn {
  /** Attach this to the <canvas> element. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Whether the animation loop is currently running. */
  isRunning: boolean;
  /** Start / pause the animation. */
  toggle: () => void;
  /** Switch effect preset on the fly. */
  setEffect: (effect: WarpEffect) => void;
}

export function useWarp(opts: UseWarpOptions =) {}: UseWarpReturn {
  const { autoStart = true, ...engineOpts } = opts;

  const canvasRef  = useRef<HTMLCanvasElement | null>(null);
  const engineRef  = useRef<WarpEngine | null>(null);
  const rafRef     = useRef<number | null>(null);
  const lastTsRef  = useRef<number>(0);
  const runningRef = useRef<boolean>(false);

  const [isRunning, setIsRunning] = useState(autoStart);

  // Initialise engine once
  useEffect(() => {
    engineRef.current = new WarpEngine(engineOpts);
     
  }, []);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio ?? 1;
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
      engineRef.current?.resize(canvas.clientWidth, canvas.clientHeight);
    });
    observer.observe(canvas);

    // Initial size
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width  = canvas.clientWidth  * dpr;
    canvas.height = canvas.clientHeight * dpr;
    engineRef.current?.resize(canvas.clientWidth, canvas.clientHeight);

    return () => observer.disconnect();
  }, []);

  // Animation loop
  const loop = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const elapsed = ts - lastTsRef.current;
    if (elapsed < FRAME_INTERVAL_MS) {
      // Skip this frame to honour the 30 fps passive cap.
      if (runningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
      return;
    }

    const dt = Math.min(elapsed / 1000, 0.05); // cap at 50 ms
    lastTsRef.current = ts;

    const dpr = window.devicePixelRatio ?? 1;

    // Step simulation
    engine.step(dt);

    // Render
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      for (const p of engine.particles) {
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * 0.7;
        ctx.fill();
        // Soft glow
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * 0.08;
        ctx.fill();
      }

      ctx.restore();
    }

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, []);

  // Start / stop, also bound to document visibility and prefers-reduced-motion
  // so the ambient effect does not burn CPU/GPU/battery in background tabs
  // or for users who have requested reduced motion.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionMQ = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const isReducedMotion = () => !!reducedMotionMQ?.matches;
    const isHidden = () =>
      typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const stopLoop = () => {
      runningRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const startLoop = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      lastTsRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    };

    const sync = () => {
      if (isRunning && !isHidden() && !isReducedMotion()) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    sync();

    const onVisibility = () => sync();
    const onMotionChange = () => sync();

    document.addEventListener('visibilitychange', onVisibility);
    reducedMotionMQ?.addEventListener?.('change', onMotionChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotionMQ?.removeEventListener?.('change', onMotionChange);
      stopLoop();
    };
  }, [isRunning, loop]);

  const toggle = useCallback(() => setIsRunning(prev => !prev), []);

  const setEffect = useCallback((effect: WarpEffect) => {
    engineRef.current?.setEffect(effect);
    engineRef.current?.reset();
  }, []);

  return { canvasRef, isRunning, toggle, setEffect };
}
