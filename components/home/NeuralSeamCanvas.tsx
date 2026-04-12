'use client';

/**
 * components/home/NeuralSeamCanvas.tsx
 *
 * NEURAL SEAM CANVAS — Living Runtime Bridge Visualization
 *
 * This component renders a full-width Canvas overlay positioned at the
 * DreamDMBar seam (the split-screen divider between Surface Space and
 * DreamSpace). It subscribes to the live dualRuntimeBridge emission stream
 * and renders each cross-Engin event as a glowing particle flowing across the
 * spatial boundary between the two runtimes.
 *
 * The result: the invisible OS data bus becomes physically visible matter.
 * Users can watch code emissions, music events, and game state transitions
 * streak across the seam in their canonical colors.
 *
 * Architecture:
 *   - `position: fixed`, `pointer-events: none`, `z-index: 99`
 *     (sits just BELOW the DreamDMBar pill at z-index 100)
 *   - Canvas spans 100vw × (DIVIDER_H + BLEED_PX * 2) with vertical bleed
 *     so glow effects bloom naturally above and below the seam
 *   - Pure Canvas 2D API — no Three.js / Babylon dependency
 *   - requestAnimationFrame loop: ~60fps, pauses when tab hidden
 *   - Bridge subscription: each emission spawns one SeamParticle
 *   - Idle particles: 3 slow ambient drifters keep the seam alive at rest
 *
 * Only active when `active` prop is true (i.e. HomeSystem divider mode).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';
import {
  createSeamParticle,
  createIdleParticle,
  tickParticles,
  evictDeadParticles,
  type SeamParticle,
} from '@/lib/dreamdm/bridgeSeamFlow';

// Extra canvas height above/below the seam line for glow bleed.
const BLEED_PX = 28;

// How many idle ambient particles to maintain when nothing is firing.
const IDLE_PARTICLE_TARGET = 3;

// Minimum ms between idle particle spawns.
const IDLE_SPAWN_INTERVAL_MS = 2200;

interface NeuralSeamCanvasProps {
  /** Whether the canvas should render (true when divider mode is active). */
  active: boolean;
  /** Current split ratio from DreamSystemContext (0..1). */
  splitRatio: number;
}

export default function NeuralSeamCanvas({ active, splitRatio }: NeuralSeamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SeamParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastFrameAt = useRef<number>(0);
  const lastIdleSpawnAt = useRef<number>(0);
  const screenHRef = useRef<number>(typeof window !== 'undefined' ? window.innerHeight : 812);
  const screenWRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth : 390);

  // ── Compute seam Y from splitRatio and screen height ──────────────────────

  const getSeamTop = useCallback((): number => {
    return Math.round(splitRatio * (screenHRef.current - DIVIDER_H));
  }, [splitRatio]);

  // ── Canvas resize ──────────────────────────────────────────────────────────

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = DIVIDER_H + BLEED_PX * 2;
    screenHRef.current = window.innerHeight;
    screenWRef.current = w;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  // ── Draw one frame ─────────────────────────────────────────────────────────

  const drawFrame = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min(now - (lastFrameAt.current || now), 64); // cap at 64ms
    lastFrameAt.current = now;

    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = DIVIDER_H + BLEED_PX * 2;
    const centerY = H / 2;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // ── Background gradient — subtle darkening at seam center ──────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0,   'rgba(0,0,0,0)');
    bgGrad.addColorStop(0.35,'rgba(8,12,28,0.10)');
    bgGrad.addColorStop(0.5, 'rgba(8,12,28,0.18)');
    bgGrad.addColorStop(0.65,'rgba(8,12,28,0.10)');
    bgGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Neural grid — faint horizontal scan lines ──────────────────────────
    ctx.save();
    ctx.setLineDash([2, 8]);
    ctx.lineWidth = 0.5;
    const gridLines = [0.2, 0.35, 0.5, 0.65, 0.8];
    for (const frac of gridLines) {
      const y = frac * H;
      const dist = Math.abs(frac - 0.5); // 0 at center, 0.5 at edges
      const opacity = 0.06 - dist * 0.08;
      if (opacity <= 0) continue;
      ctx.strokeStyle = `rgba(125,211,252,${opacity.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // ── Center line — very faint gold seam indicator ───────────────────────
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(200,152,26,0.07)';
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(W, centerY);
    ctx.stroke();
    ctx.restore();

    // ── Idle ambient heartbeat — slow sine-wave glow band ─────────────────
    const pulseAlpha = 0.04 + 0.02 * Math.sin(now * 0.0007);
    const idleGlow = ctx.createRadialGradient(W / 2, centerY, 0, W / 2, centerY, W * 0.4);
    idleGlow.addColorStop(0, `rgba(93,232,255,${pulseAlpha.toFixed(3)})`);
    idleGlow.addColorStop(1, 'rgba(93,232,255,0)');
    ctx.fillStyle = idleGlow;
    ctx.fillRect(0, centerY - 20, W, 40);

    // ── Spawn idle particles when the queue is thin ────────────────────────
    const now2 = now;
    const hasEnoughIdle = particlesRef.current.filter(p => p.isIdle).length >= IDLE_PARTICLE_TARGET;
    if (!hasEnoughIdle && now2 - lastIdleSpawnAt.current > IDLE_SPAWN_INTERVAL_MS) {
      const startX = Math.random() * 0.3; // always start near left edge
      particlesRef.current.push(createIdleParticle(startX));
      lastIdleSpawnAt.current = now2;
    }

    // ── Tick physics ───────────────────────────────────────────────────────
    tickParticles(particlesRef.current, dt);
    particlesRef.current = evictDeadParticles(particlesRef.current);

    // ── Draw particles ─────────────────────────────────────────────────────
    for (const p of particlesRef.current) {
      const px = p.x * W;
      const py = centerY + p.y;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (!p.isIdle && p.glow > 0.8) {
        // Glow halo for emission particles
        const glowRadius = p.size * p.glow * 5;
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
        glowGrad.addColorStop(0, p.color + 'cc');
        glowGrad.addColorStop(0.4, p.color + '44');
        glowGrad.addColorStop(1, p.color + '00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core particle
      ctx.shadowBlur = p.isIdle ? 4 : p.size * p.glow * 3;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }, []);

  // ── rAF loop ───────────────────────────────────────────────────────────────

  const startLoop = useCallback(() => {
    const tick = (now: number) => {
      if (!active) return;
      drawFrame(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [active, drawFrame]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!active) return;
    resizeCanvas();
    startLoop();

    const onResize = () => {
      resizeCanvas();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Pause when tab is hidden (battery-safe).
    const onVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopLoop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, resizeCanvas, startLoop, stopLoop]);

  // ── Bridge subscription — spawn particle on every emission ────────────────

  useEffect(() => {
    if (!active) return;

    const unsub = bridge.subscribeEventActivity((emission) => {
      particlesRef.current.push(createSeamParticle(emission.channel));
      // Cap total live particles to prevent runaway allocations.
      if (particlesRef.current.length > 80) {
        // Remove oldest non-idle particles first.
        const oldest = particlesRef.current.find(p => !p.isIdle);
        if (oldest) {
          particlesRef.current = particlesRef.current.filter(p => p.id !== oldest.id);
        }
      }
    });

    return unsub;
  }, [active]);

  // ── Canvas position — tracks splitRatio ───────────────────────────────────

  const seamTop = getSeamTop();
  const canvasTop = seamTop - BLEED_PX;

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: canvasTop,
        left: 0,
        width: '100vw',
        height: DIVIDER_H + BLEED_PX * 2,
        zIndex: 99,
        pointerEvents: 'none',
        // Soft fade at top/bottom edges so it doesn't hard-clip the glow.
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
    />
  );
}
