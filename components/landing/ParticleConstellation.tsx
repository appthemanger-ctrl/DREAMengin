'use client';

/**
 * ParticleConstellation — Interactive canvas constellation for the landing hero.
 *
 * Features:
 *  - ~72 glowing particles drifting slowly through deep-space
 *  - Proximity connections drawn as luminous line threads (≤180 px)
 *  - Mouse cursor acts as a gravity well — pulls nearby particles gently
 *  - Occasional spontaneous "nova" bursts on random particles
 *  - Colors follow the DREAMengin palette: gold, sky-blue, silver
 *  - Full-viewport fixed canvas; sits behind page content (z-index 1)
 *  - Uses requestAnimationFrame + proper cleanup; pauses when tab is hidden
 */

import { useEffect, useRef, useCallback } from 'react';

// ── Palette ────────────────────────────────────────────────────────────────────
const PALETTE = [
  { r: 200, g: 152, b: 26  },  // gold
  { r:  56, g: 189, b: 248 },  // sky-blue
  { r: 232, g: 184, b:  48 },  // gold-bright
  { r: 160, g: 195, b: 240 },  // ice-blue
  { r: 255, g: 255, b: 255 },  // silver-white
];

interface Particle {
  x:     number;
  y:     number;
  vx:    number;
  vy:    number;
  r:     number;  // base radius
  pulse: number;  // phase offset for breathing
  speed: number;  // pulse speed
  col:   typeof PALETTE[number];
  alpha: number;
  nova:  number;  // [0,1] nova intensity — decays fast
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeParticle(w: number, h: number): Particle {
  return {
    x:     rand(0, w),
    y:     rand(0, h),
    vx:    rand(-14, 14),
    vy:    rand(-14, 14),
    r:     rand(1.2, 3.2),
    pulse: rand(0, Math.PI * 2),
    speed: rand(0.4, 1.1),
    col:   PALETTE[Math.floor(Math.random() * PALETTE.length)],
    alpha: rand(0.35, 0.85),
    nova:  0,
  };
}

const PARTICLE_COUNT = 72;
const CONNECT_DIST   = 180;
const GRAVITY_RADIUS = 160;
const GRAVITY_FORCE  = 28; // px/s² pull toward cursor

export default function ParticleConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{
    particles:  Particle[];
    mouse:      { x: number; y: number; inside: boolean };
    raf:        number;
    lastTime:   number;
    novaTimer:  number;
  } | null>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();

    const w = window.innerWidth;
    const h = window.innerHeight;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      makeParticle(w, h)
    );

    stateRef.current = {
      particles,
      mouse: { x: -999, y: -999, inside: false },
      raf:   0,
      lastTime: performance.now(),
      novaTimer: 0,
    };

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      if (!stateRef.current) return;
      stateRef.current.mouse.x = e.clientX;
      stateRef.current.mouse.y = e.clientY;
      stateRef.current.mouse.inside = true;
    };
    const onMouseLeave = () => {
      if (!stateRef.current) return;
      stateRef.current.mouse.inside = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // ── Main render loop ─────────────────────────────────────────────────────
    function draw(ts: number) {
      const s = stateRef.current;
      if (!s) return;

      const dt = Math.min((ts - s.lastTime) / 1000, 0.05); // cap at 50 ms
      s.lastTime = ts;
      s.novaTimer += dt;

      const ctx = canvas!.getContext('2d');
      if (!ctx) return;

      const cw = window.innerWidth;
      const ch = window.innerHeight;

      ctx.clearRect(0, 0, cw, ch);

      // Spontaneous nova — ~every 2.5 s a random particle bursts
      if (s.novaTimer > 2.5) {
        s.novaTimer = 0;
        const p = s.particles[Math.floor(Math.random() * s.particles.length)];
        p.nova = 1.0;
      }

      const { x: mx, y: my, inside } = s.mouse;

      // ── Update + draw particles ────────────────────────────────────────────
      for (const p of s.particles) {
        // Gravity pull toward mouse
        if (inside) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < GRAVITY_RADIUS * GRAVITY_RADIUS && dist2 > 1) {
            const dist = Math.sqrt(dist2);
            const strength = (1 - dist / GRAVITY_RADIUS) * GRAVITY_FORCE;
            p.vx += (dx / dist) * strength * dt;
            p.vy += (dy / dist) * strength * dt;
          }
        }

        // Speed limit
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpd = 60;
        if (spd > maxSpd) {
          p.vx = (p.vx / spd) * maxSpd;
          p.vy = (p.vy / spd) * maxSpd;
        }

        // Gentle damping
        p.vx *= 1 - dt * 0.8;
        p.vy *= 1 - dt * 0.8;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wrap around edges
        if (p.x < -20)   p.x = cw + 20;
        if (p.x > cw + 20) p.x = -20;
        if (p.y < -20)   p.y = ch + 20;
        if (p.y > ch + 20) p.y = -20;

        // Nova decay
        if (p.nova > 0) p.nova = Math.max(0, p.nova - dt * 1.8);

        // Breathing radius
        const t = ts / 1000;
        const breathe = 1 + 0.35 * Math.sin(t * p.speed + p.pulse);
        const drawR = p.r * breathe + p.nova * 6;
        const drawA = Math.min(1, p.alpha + p.nova * 0.6);

        const { r, g, b } = p.col;

        // Outer glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, drawR * 4.5);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${drawA})`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},${drawA * 0.4})`);
        grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR * 4.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${drawA})`;
        ctx.fill();
      }

      // ── Draw constellation connections ────────────────────────────────────
      const pts = s.particles;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONNECT_DIST) continue;

          const fade = 1 - dist / CONNECT_DIST;
          const lineA = fade * 0.28;

          // Blend the two particle colors for the thread
          const c1 = pts[i].col;
          const c2 = pts[j].col;
          const mr = (c1.r + c2.r) >> 1;
          const mg = (c1.g + c2.g) >> 1;
          const mb = (c1.b + c2.b) >> 1;

          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(${mr},${mg},${mb},${lineA})`;
          ctx.lineWidth = fade * 1.1;
          ctx.stroke();
        }
      }

      // ── Mouse cursor glow halo ─────────────────────────────────────────────
      if (inside && mx > 0) {
        const g2 = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        g2.addColorStop(0,   'rgba(200,152,26,0.12)');
        g2.addColorStop(0.5, 'rgba(56,189,248,0.06)');
        g2.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(mx, my, 90, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();
      }

      s.raf = requestAnimationFrame(draw);
    }

    stateRef.current.raf = requestAnimationFrame(draw);

    // Resize handler
    const onResize = () => {
      resize();
      // Re-seed out-of-bounds particles
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      if (stateRef.current) {
        for (const p of stateRef.current.particles) {
          if (p.x > ww) p.x = rand(0, ww);
          if (p.y > wh) p.y = rand(0, wh);
        }
      }
    };
    window.addEventListener('resize', onResize);

    // Pause when tab hidden (battery-friendly)
    const onVisibilityChange = () => {
      if (!stateRef.current) return;
      if (document.hidden) {
        cancelAnimationFrame(stateRef.current.raf);
      } else {
        stateRef.current.lastTime = performance.now();
        stateRef.current.raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (stateRef.current) cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:          0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        mixBlendMode:  'screen',
        zIndex:         1,
      }}
    />
  );
}
