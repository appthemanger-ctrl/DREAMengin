'use client';

import { useEffect, useRef } from 'react';
import { mu } from '@/lib/torridity/physics';
import { n as MOND_N } from '@/lib/torridity/constants';

// ═══════════════════════════════════════════════════════════
//  T U N A B L E S  (pure physics, no morphology helpers)
// ═══════════════════════════════════════════════════════════
const GAS_COUNT = 4000;
const DARK_COUNT = 1500;
const G = 0.28;
const SOFTENING = 4.0;          // Plummer softening to prevent singularities
const A0 = 0.22;               // MOND acceleration scale
const MAX_VELOCITY = 8.0;      // soft numerical ceiling (must exist to keep integrator stable)

// Radiation pressure
const RAD_STRENGTH = 320;      // initial outward push from the fireball (arbitrary units)
const RAD_DECAY = 0.35;        // e-folding time in seconds
const RAD_BACKGROUND = 0.0005; // tiny per‑second constant outward kick (the "everywhere" light pressure)

// Initial conditions
const INITIAL_SPREAD = 0.1;    // fraction of viewport size the initial cloud occupies

// ═══════════════════════════════════════════════════════════
//  P A R T I C L E   T Y P E S
// ═══════════════════════════════════════════════════════════
interface Gas {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

interface Dark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

// ═══════════════════════════════════════════════════════════
//  C O R E   C O M P O N E N T
// ═══════════════════════════════════════════════════════════
export default function UniverseField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext('2d', { alpha: false });
    if (!rawCtx) return;
    const ctx: CanvasRenderingContext2D = rawCtx;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2); // cap at 2 for memory

    let gas: Gas[] = [];
    let dark: Dark[] = [];
    let timeSec = 0;
    let lastTime = performance.now();

    // ── Initial big bang cloud ───────────────────────────
    function seed() {
      const cx = width / 2;
      const cy = height / 2;
      const spread = Math.min(width, height) * INITIAL_SPREAD;

      // Gas particles
      gas = [];
      for (let i = 0; i < GAS_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 3) * spread; // clumped toward centre
        gas.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
          mass: 0.3 + Math.random() * 1.2,
        });
      }

      // Dark matter particles (collisionless, feel only gravity)
      dark = [];
      for (let i = 0; i < DARK_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 3) * spread * 1.1;
        dark.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
          mass: 0.5 + Math.random() * 2.0,
        });
      }
    }

    // ── Radiation force on gas at position (px, py) ──────
    function radiationAccel(px: number, py: number, t: number): { ax: number; ay: number } {
      const dx = px - width / 2;
      const dy = py - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy + SOFTENING * SOFTENING);
      // Fireball flash + cosmic background
      const strength = RAD_STRENGTH * Math.exp(-t * RAD_DECAY) + RAD_BACKGROUND;
      const force = strength / Math.max(dist, 1.0);
      return {
        ax: (dx / dist) * force,
        ay: (dy / dist) * force,
      };
    }

    // ── Physics tick ──────────────────────────────────────
    function update(dt: number) {
      timeSec += dt;
      // Enforce minimum dt to avoid huge jumps, but no framerate target
      const step = Math.min(dt, 0.1);

      // --- Build flat lists for force loop ---
      const gasActive = gas.filter(p => p.mass > 0);  // all are active, no removal
      const darkAll = dark;
      const allMasses: { x: number; y: number; mass: number; isGas: boolean }[] = [];
      for (const p of gasActive) allMasses.push({ x: p.x, y: p.y, mass: p.mass, isGas: true });
      for (const d of darkAll) allMasses.push({ x: d.x, y: d.y, mass: d.mass, isGas: false });

      const n = allMasses.length;
      const ax = new Float32Array(n);
      const ay = new Float32Array(n);

      // --- O(N²) gravity with MOND (no shortcuts) ---
      for (let i = 0; i < n; i++) {
        const a = allMasses[i];
        let fx = 0, fy = 0;
        for (let j = i + 1; j < n; j++) {
          const b = allMasses[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const r2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
          const r = Math.sqrt(r2);
          const aN_i = (G * b.mass) / r2; // acceleration on i from j
          const x_i = aN_i / A0;
          const boost_i = 1 / Math.max(mu(x_i), 0.05);
          const aMag_i = aN_i * boost_i;

          const aN_j = (G * a.mass) / r2; // acceleration on j from i
          const x_j = aN_j / A0;
          const boost_j = 1 / Math.max(mu(x_j), 0.05);
          const aMag_j = aN_j * boost_j;

          const invR = 1 / r;
          const ux = dx * invR;
          const uy = dy * invR;
          fx += aMag_i * ux;
          fy += aMag_i * uy;
          ax[j] -= aMag_j * ux;
          ay[j] -= aMag_j * uy;
        }
        ax[i] += fx;
        ay[i] += fy;
      }

      // --- Apply forces (gravity + radiation) ---
      let idx = 0;
      for (const p of gasActive) {
        const gax = ax[idx];
        const gay = ay[idx];
        const rad = radiationAccel(p.x, p.y, timeSec);
        p.vx += (gax + rad.ax) * step;
        p.vy += (gay + rad.ay) * step;
        idx++;
      }
      for (const d of darkAll) {
        d.vx += ax[idx] * step;
        d.vy += ay[idx] * step;
        idx++;
      }

      // --- Integrate positions ---
      for (const p of gasActive) {
        p.x += p.vx * step;
        p.y += p.vy * step;
        // Soft speed limiter – purely numerical
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_VELOCITY) {
          const k = MAX_VELOCITY / speed;
          p.vx *= k;
          p.vy *= k;
        }
        // Toroidal wrap (universe repeats)
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
      for (const d of darkAll) {
        d.x += d.vx * step;
        d.y += d.vy * step;
        const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        if (speed > MAX_VELOCITY) {
          const k = MAX_VELOCITY / speed;
          d.vx *= k;
          d.vy *= k;
        }
        if (d.x < 0) d.x = width;
        if (d.x > width) d.x = 0;
        if (d.y < 0) d.y = height;
        if (d.y > height) d.y = 0;
      }
    }

    // ── Render (no sprites, just raw particles) ──────────
    function render() {
      // Faint dark background with trailing
      ctx.fillStyle = 'rgba(2, 2, 5, 0.92)';
      ctx.fillRect(0, 0, width, height);

      // Dark matter – invisible, not drawn (but you could turn on faint dots if curious)

      // Gas – colour by mass
      for (const p of gas) {
        const size = Math.sqrt(p.mass) * 0.5;
        if (p.mass > 120) {
          ctx.fillStyle = '#ffffff';        // proto‑core
        } else if (p.mass > 40) {
          ctx.fillStyle = '#a0d0ff';        // hot massive clump
        } else if (p.mass > 12) {
          ctx.fillStyle = '#ffc080';        // warm gas
        } else {
          ctx.fillStyle = 'rgba(100, 90, 130, 0.65)'; // cold diffuse
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Frame loop ───────────────────────────────────────
    function frame(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      update(dt);
      render();
      requestAnimationFrame(frame);
    }

    // ── Resize handler (keeps the existing universe, only canvas changes) ──
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Start ────────────────────────────────────────────
    resize();
    seed();
    lastTime = performance.now();
    requestAnimationFrame(frame);

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-mond-n={MOND_N}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
