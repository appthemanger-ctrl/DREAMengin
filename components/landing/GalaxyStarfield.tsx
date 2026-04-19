'use client';

import { useEffect, useRef } from 'react';
import { mu } from '@/lib/torridity/physics';
import { n as MOND_N } from '@/lib/torridity/constants';

/**
 * GalaxyStarfield — persistent galactic-rotation starfield.
 *
 * Replaces the multi-phase ParticleConstellation black-hole storyboard with a
 * quiet, always-on galaxy:
 *   • Stars orbit a central black hole on near-circular trajectories.
 *   • Tangential orbital speed v(r) = v0 · sqrt(mu(x))   where mu is the MOND
 *     interpolation function (n = 2.1) from lib/torridity. This produces the
 *     flat outer rotation curve characteristic of real galaxies.
 *   • The MOND scale a0 is *re-scaled to screen size* (a0_screen ∝ 1 / R_max)
 *     so the rotation curve flattens at a perceptible fraction of the canvas
 *     instead of at astronomical distances.
 *   • The black hole is permanent; periodic bipolar quasar jets fire from it.
 *
 * Designed to be lightweight: O(N) per frame, no per-particle gradients in the
 * hot loop, fixed-cap particle count, and skipped redraws when the tab is
 * hidden.
 */

interface Star {
  /** Polar coordinates around the galactic center (px, radians). */
  r: number;
  theta: number;
  /** Angular velocity (rad / s) — derived from the MOND rotation curve. */
  omega: number;
  /** Visual properties. */
  size: number;
  alpha: number;
  hue: number; // 0 = warm white, 1 = blue
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Quasar {
  /** Seconds remaining in the current burst (0 = idle). */
  life: number;
  /** Total burst duration. */
  duration: number;
  /** Jet axis angle in radians. */
  angle: number;
  /** Time until the next burst fires. */
  cooldown: number;
}

const STAR_COUNT = 140;
/** Galactic-center "Newtonian" velocity scale before MOND modulation (px/s). */
const V0 = 70;
/** Inner cutoff so stars don't pile at the singularity (in px). */
const R_MIN = 18;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spectralColor(hue: number) {
  // Warm-white → blue-white sweep matching real stellar spectra.
  if (hue < 0.25) return '255,222,176';
  if (hue < 0.55) return '255,240,210';
  if (hue < 0.80) return '230,238,255';
  return '186,212,255';
}

/**
 * Compute a MOND-modulated angular velocity for a star at radius r.
 *
 *   x      = r / r0       (dimensionless radius vs MOND scale)
 *   factor = mu(x)        (≈ x for x ≪ 1, → 1 for x ≫ 1)
 *   v(r)   = V0 · sqrt(factor)
 *   ω(r)   = v(r) / r
 *
 * The factor sqrt(mu(x)) gives the iconic flat outer rotation curve while
 * keeping inner orbits fast — exactly what we want for a believable galaxy.
 */
function omegaFor(r: number, r0: number) {
  const x = r / Math.max(r0, 1);
  const factor = Math.max(mu(x), 1e-4);
  const v = V0 * Math.sqrt(factor);
  return v / Math.max(r, R_MIN);
}

export default function GalaxyStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasEl = canvas;
    const ctx2d = ctx;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let cx = width * 0.62;
    let cy = height * 0.42;
    /** MOND scale radius — 22% of screen diagonal flattens the curve nicely. */
    let r0 = Math.hypot(width, height) * 0.22;
    let rMax = Math.hypot(width, height) * 0.55;

    const stars: Star[] = [];
    const quasar: Quasar = {
      life: 0,
      duration: 1.6,
      angle: rand(0, Math.PI),
      cooldown: rand(6, 11),
    };

    function seed() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        // Power-law radial distribution — denser near the bulge, thinning out.
        const u = Math.random();
        const r = R_MIN + Math.pow(u, 0.55) * (rMax - R_MIN);
        const theta = rand(0, Math.PI * 2);
        stars.push({
          r,
          theta,
          omega: omegaFor(r, r0),
          size: Math.random() > 0.92 ? rand(1.4, 2.4) : rand(0.4, 1.2),
          alpha: rand(0.35, 0.95),
          hue: Math.random(),
          twinklePhase: rand(0, Math.PI * 2),
          twinkleSpeed: rand(0.5, 1.8),
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width * 0.62;
      cy = height * 0.42;
      r0 = Math.hypot(width, height) * 0.22;
      rMax = Math.hypot(width, height) * 0.55;
      // Re-derive omegas at the new screen-scaled MOND radius.
      for (const s of stars) s.omega = omegaFor(s.r, r0);
    }

    function drawBlackHole(t: number) {
      // Soft outer halo (always present).
      const halo = ctx2d.createRadialGradient(cx, cy, 4, cx, cy, 90);
      halo.addColorStop(0, 'rgba(255,210,150,0.35)');
      halo.addColorStop(0.45, 'rgba(120,90,180,0.10)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx2d.fillStyle = halo;
      ctx2d.beginPath();
      ctx2d.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx2d.fill();

      // Accretion disk (slowly rotating thin ellipse).
      ctx2d.save();
      ctx2d.translate(cx, cy);
      ctx2d.rotate(t * 0.12);
      ctx2d.scale(1, 0.32);
      const disk = ctx2d.createRadialGradient(0, 0, 16, 0, 0, 60);
      disk.addColorStop(0, 'rgba(255,200,140,0.55)');
      disk.addColorStop(0.6, 'rgba(255,120,60,0.18)');
      disk.addColorStop(1, 'rgba(0,0,0,0)');
      ctx2d.fillStyle = disk;
      ctx2d.beginPath();
      ctx2d.arc(0, 0, 60, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();

      // Event horizon (true black core).
      ctx2d.fillStyle = '#000';
      ctx2d.beginPath();
      ctx2d.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx2d.fill();
    }

    function drawQuasar() {
      if (quasar.life <= 0) return;
      const tNorm = 1 - quasar.life / quasar.duration; // 0 → 1 over the burst
      // Envelope: fast rise, slow decay.
      const env = Math.sin(Math.min(tNorm, 1) * Math.PI);
      const length = (rMax * 1.1) * Math.min(1, tNorm * 2.4);

      for (const dir of [0, Math.PI]) {
        const ang = quasar.angle + dir;
        const ex = cx + Math.cos(ang) * length;
        const ey = cy + Math.sin(ang) * length;
        const grad = ctx2d.createLinearGradient(cx, cy, ex, ey);
        grad.addColorStop(0, `rgba(255,240,210,${0.85 * env})`);
        grad.addColorStop(0.25, `rgba(120,200,255,${0.55 * env})`);
        grad.addColorStop(1, 'rgba(20,40,90,0)');
        ctx2d.strokeStyle = grad;
        ctx2d.lineWidth = 4 + env * 6;
        ctx2d.lineCap = 'round';
        ctx2d.beginPath();
        ctx2d.moveTo(cx, cy);
        ctx2d.lineTo(ex, ey);
        ctx2d.stroke();
      }
    }

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now * 0.001;

      // Quasar lifecycle.
      if (quasar.life > 0) {
        quasar.life -= dt;
        if (quasar.life <= 0) {
          quasar.life = 0;
          quasar.cooldown = rand(7, 13);
        }
      } else {
        quasar.cooldown -= dt;
        if (quasar.cooldown <= 0) {
          quasar.life = quasar.duration;
          quasar.angle = rand(0, Math.PI * 2);
        }
      }

      ctx2d.clearRect(0, 0, width, height);
      drawQuasar();
      drawBlackHole(t);

      // Stars: pure rotational motion in (r, θ) with twinkle.
      for (const s of stars) {
        s.theta += s.omega * dt;
        const x = cx + Math.cos(s.theta) * s.r;
        const y = cy + Math.sin(s.theta) * s.r * 0.55; // disk inclination
        const tw = 0.78 + 0.22 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const a = s.alpha * tw;
        ctx2d.fillStyle = `rgba(${spectralColor(s.hue)},${a})`;
        ctx2d.beginPath();
        ctx2d.arc(x, y, s.size, 0, Math.PI * 2);
        ctx2d.fill();
      }
    }

    function loop(now: number) {
      frame(now);
      raf = requestAnimationFrame(loop);
    }

    function onVis() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }

    resize();
    seed();
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // MOND interpolation exponent recorded for documentation/inspection.
      data-mond-n={MOND_N}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
