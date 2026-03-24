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

export function useWarp(opts: UseWarpOptions = {}): UseWarpReturn {
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

    const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05); // cap at 50 ms
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

  // Start / stop
  useEffect(() => {
    runningRef.current = isRunning;

    if (isRunning) {
      lastTsRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } else if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning, loop]);

  const toggle = useCallback(() => setIsRunning(prev => !prev), []);

  const setEffect = useCallback((effect: WarpEffect) => {
    engineRef.current?.setEffect(effect);
    engineRef.current?.reset();
  }, []);

  return { canvasRef, isRunning, toggle, setEffect };
}
