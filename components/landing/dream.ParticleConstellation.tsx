'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * ParticleConstellation — physically-inspired landing starfield.
 *
 * Notes:
 *  - Replaces the old connected-dot constellation with a proper starfield.
 *  - Uses softened Newtonian gravity + tangential frame-dragging swirl for the
 *    landing-page black hole sequence.
 *  - Keeps the render loop O(n) so the hero stays performant on the main page.
 */

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  depth: number;
  alpha: number;
  temperature: number;
  twinklePhase: number;
  twinkleSpeed: number;
  flare: number;
  ox: number;
  oy: number;
}

type BHPhase = 'idle' | 'forming' | 'singularity' | 'exploding' | 'settling';

interface BlackHoleState {
  phase: BHPhase;
  timer: number;
  triggerAfter: number;
  cx: number;
  cy: number;
  pullForce: number;
  spinForce: number;
  glowAlpha: number;
  ringR: number;
  diskR: number;
}

interface SceneState {
  particles: StarParticle[];
  mouse: { x: number; y: number; inside: boolean };
  raf: number;
  lastTime: number;
  width: number;
  height: number;
  bh: BlackHoleState;
}

const PARTICLE_COUNT = 110;
const CURSOR_RADIUS = 170;
const CURSOR_FORCE = 22;
const EDGE_WRAP = 60;
const MAX_IDLE_SPEED = 28;
const MAX_SINGULARITY_SPEED = 240;
const MAX_EXPLOSION_SPEED = 520;
const SOFTENING = 3600;

const BH_IDLE_MIN = 10;
const BH_FORMING_DUR = 4.5;
const BH_SINGULAR_DUR = 3.2;
const BH_EXPLODE_DUR = 1.2;
const BH_SETTLE_DUR = 4.8;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function spectralColor(temperature: number) {
  if (temperature < 0.18) return { r: 255, g: 214, b: 156 };
  if (temperature < 0.38) return { r: 255, g: 232, b: 188 };
  if (temperature < 0.62) return { r: 248, g: 246, b: 255 };
  if (temperature < 0.82) return { r: 194, g: 225, b: 255 };
  return { r: 152, g: 196, b: 255 };
}

function makeParticle(w: number, h: number): StarParticle {
  const depth = rand(0.35, 1);
  const radius = Math.random() > 0.88 ? rand(1.3, 2.5) : rand(0.45, 1.35);
  const x = rand(0, w);
  const y = rand(0, h);

  return {
    x,
    y,
    vx: rand(-12, 12) * depth,
    vy: rand(-10, 10) * depth,
    radius,
    depth,
    alpha: rand(0.42, 0.98),
    temperature: Math.random(),
    twinklePhase: rand(0, Math.PI * 2),
    twinkleSpeed: rand(0.7, 2.4),
    flare: 0,
    ox: x,
    oy: y,
  };
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  particle: StarParticle,
  timeSeconds: number,
  blackHole: BlackHoleState,
) {
  const twinkle =
    0.78 +
    0.22 * Math.sin(timeSeconds * particle.twinkleSpeed + particle.twinklePhase);
  const brightness = clamp(particle.alpha * twinkle + particle.flare * 0.35, 0.15, 1);
  const color = spectralColor(particle.temperature);

  const dx = particle.x - blackHole.cx;
  const dy = particle.y - blackHole.cy;
  const dist = Math.hypot(dx, dy);
  const lensT =
    blackHole.glowAlpha > 0.01
      ? clamp(1 - dist / Math.max(blackHole.diskR, 1), 0, 1) * blackHole.glowAlpha
      : 0;

  const renderX = particle.x + (dx / Math.max(dist, 1)) * lensT * 7 * particle.depth;
  const renderY = particle.y + (dy / Math.max(dist, 1)) * lensT * 7 * particle.depth;
  const glowRadius = particle.radius * (3.4 + particle.depth * 2.1) + particle.flare * 7;
  const coreRadius = particle.radius * (0.9 + particle.flare * 0.4);

  const glow = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, glowRadius);
  glow.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${brightness})`);
  glow.addColorStop(0.35, `rgba(${color.r},${color.g},${color.b},${brightness * 0.28})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(renderX, renderY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${brightness})`;
  ctx.beginPath();
  ctx.arc(renderX, renderY, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  if (particle.radius > 1.2 || particle.flare > 0.08) {
    const spikeAlpha = brightness * (0.24 + particle.flare * 0.18);
    const spikeLength = glowRadius * 1.8;
    ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${spikeAlpha})`;
    ctx.lineWidth = Math.max(0.7, particle.radius * 0.22);
    ctx.beginPath();
    ctx.moveTo(renderX - spikeLength, renderY);
    ctx.lineTo(renderX + spikeLength, renderY);
    ctx.moveTo(renderX, renderY - spikeLength);
    ctx.lineTo(renderX, renderY + spikeLength);
    ctx.stroke();
  }
}

function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  bh: BlackHoleState,
  timeSeconds: number,
) {
  if (bh.glowAlpha <= 0.01) return;

  const halo = ctx.createRadialGradient(bh.cx, bh.cy, bh.ringR * 0.15, bh.cx, bh.cy, bh.diskR * 1.55);
  halo.addColorStop(0, `rgba(0,0,0,${Math.min(0.98, bh.glowAlpha * 1.7)})`);
  halo.addColorStop(0.18, `rgba(12,12,20,${bh.glowAlpha * 0.95})`);
  halo.addColorStop(0.46, `rgba(42,20,84,${bh.glowAlpha * 0.46})`);
  halo.addColorStop(0.7, `rgba(20,90,160,${bh.glowAlpha * 0.16})`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(bh.cx, bh.cy, bh.diskR * 1.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(bh.cx, bh.cy);
  ctx.rotate(timeSeconds * 0.18);
  ctx.scale(1, 0.35);

  const diskOuter = Math.max(bh.diskR, bh.ringR * 1.5);
  const diskInner = Math.max(bh.ringR * 0.9, 18);
  const diskGradient = ctx.createRadialGradient(0, 0, diskInner, 0, 0, diskOuter);
  diskGradient.addColorStop(0, `rgba(255,245,220,${bh.glowAlpha * 0.6})`);
  diskGradient.addColorStop(0.22, `rgba(255,180,120,${bh.glowAlpha * 0.75})`);
  diskGradient.addColorStop(0.48, `rgba(255,118,54,${bh.glowAlpha * 0.62})`);
  diskGradient.addColorStop(0.72, `rgba(74,154,255,${bh.glowAlpha * 0.26})`);
  diskGradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = diskGradient;
  ctx.beginPath();
  ctx.arc(0, 0, diskOuter, 0, Math.PI * 2);
  ctx.arc(0, 0, diskInner, 0, Math.PI * 2, true);
  ctx.fill('evenodd');

  ctx.strokeStyle = `rgba(255,240,210,${bh.glowAlpha * 0.85})`;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, bh.ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(120,195,255,${bh.glowAlpha * 0.25})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, diskOuter * 0.8, Math.PI * 0.08, Math.PI * 1.2);
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = `rgba(0,0,0,${Math.min(1, bh.glowAlpha * 1.6)})`;
  ctx.beginPath();
  ctx.arc(bh.cx, bh.cy, bh.ringR * 0.82, 0, Math.PI * 2);
  ctx.fill();
}

export default function ParticleConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if (!state) return;

    const scaleX = state.width > 0 ? width / state.width : 1;
    const scaleY = state.height > 0 ? height / state.height : 1;

    state.width = width;
    state.height = height;
    state.bh.cx *= scaleX;
    state.bh.cy *= scaleY;

    for (const particle of state.particles) {
      particle.x *= scaleX;
      particle.y *= scaleY;
      particle.ox *= scaleX;
      particle.oy *= scaleY;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    stateRef.current = {
      particles: Array.from({ length: PARTICLE_COUNT }, () => makeParticle(width, height)),
      mouse: { x: -9999, y: -9999, inside: false },
      raf: 0,
      lastTime: performance.now(),
      width,
      height,
      bh: {
        phase: 'idle',
        timer: 0,
        triggerAfter: BH_IDLE_MIN + rand(2, 8),
        cx: width * 0.58,
        cy: height * 0.42,
        pullForce: 0,
        spinForce: 0,
        glowAlpha: 0,
        ringR: 0,
        diskR: 0,
      },
    };

    resize();

    const onMouseMove = (event: MouseEvent) => {
      const state = stateRef.current;
      if (!state) return;
      state.mouse.x = event.clientX;
      state.mouse.y = event.clientY;
      state.mouse.inside = true;
    };

    const onMouseLeave = () => {
      const state = stateRef.current;
      if (!state) return;
      state.mouse.inside = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    const draw = (ts: number) => {
      const state = stateRef.current;
      const ctx = canvas.getContext('2d');
      if (!state || !ctx) return;

      const dt = Math.min((ts - state.lastTime) / 1000, 0.05);
      state.lastTime = ts;

      const { bh } = state;
      bh.timer += dt;

      switch (bh.phase) {
        case 'idle':
          bh.pullForce = 0;
          bh.spinForce = 0;
          bh.glowAlpha = 0;
          bh.ringR = 0;
          bh.diskR = 0;
          if (bh.timer >= bh.triggerAfter) {
            bh.phase = 'forming';
            bh.timer = 0;
            bh.cx = rand(state.width * 0.34, state.width * 0.68);
            bh.cy = rand(state.height * 0.26, state.height * 0.62);
            for (const particle of state.particles) {
              particle.ox = particle.x;
              particle.oy = particle.y;
            }
          }
          break;

        case 'forming': {
          const t = clamp(bh.timer / BH_FORMING_DUR, 0, 1);
          bh.pullForce = lerp(4000, 42000, t);
          bh.spinForce = lerp(220, 1400, t);
          bh.glowAlpha = lerp(0.08, 0.72, t);
          bh.ringR = lerp(12, 42, t);
          bh.diskR = lerp(42, 170, t);
          if (t >= 1) {
            bh.phase = 'singularity';
            bh.timer = 0;
          }
          break;
        }

        case 'singularity': {
          const t = clamp(bh.timer / BH_SINGULAR_DUR, 0, 1);
          bh.pullForce = lerp(52000, 130000, t);
          bh.spinForce = lerp(1600, 4200, t);
          bh.glowAlpha = lerp(0.78, 1, t);
          bh.ringR = lerp(44, 72, t);
          bh.diskR = lerp(180, 250, t);
          if (t >= 1) {
            bh.phase = 'exploding';
            bh.timer = 0;
            for (const particle of state.particles) {
              const angle = Math.atan2(particle.y - bh.cy, particle.x - bh.cx);
              const speed = rand(180, 440);
              const tangent = rand(-0.7, 0.7);
              particle.vx = Math.cos(angle) * speed - Math.sin(angle) * tangent * speed * 0.2;
              particle.vy = Math.sin(angle) * speed + Math.cos(angle) * tangent * speed * 0.2;
              particle.flare = 1;
            }
          }
          break;
        }

        case 'exploding': {
          const t = clamp(bh.timer / BH_EXPLODE_DUR, 0, 1);
          bh.pullForce = 0;
          bh.spinForce = 0;
          bh.glowAlpha = lerp(1, 0, t);
          bh.ringR = lerp(74, 26, t);
          bh.diskR = lerp(260, 320, t);
          if (t >= 1) {
            bh.phase = 'settling';
            bh.timer = 0;
            for (const particle of state.particles) {
              particle.ox = rand(0, state.width);
              particle.oy = rand(0, state.height);
            }
          }
          break;
        }

        case 'settling': {
          const t = clamp(bh.timer / BH_SETTLE_DUR, 0, 1);
          bh.pullForce = 0;
          bh.spinForce = 0;
          bh.glowAlpha = 0;
          bh.ringR = 0;
          bh.diskR = 0;

          for (const particle of state.particles) {
            particle.vx += (particle.ox - particle.x) * dt * (0.52 + t * 0.18);
            particle.vy += (particle.oy - particle.y) * dt * (0.52 + t * 0.18);
          }

          if (t >= 1) {
            bh.phase = 'idle';
            bh.timer = 0;
            bh.triggerAfter = BH_IDLE_MIN + rand(2, 8);
          }
          break;
        }
      }

      ctx.clearRect(0, 0, state.width, state.height);

      const timeSeconds = ts * 0.001;
      drawBlackHole(ctx, bh, timeSeconds);

      for (const particle of state.particles) {
        const dx = bh.cx - particle.x;
        const dy = bh.cy - particle.y;
        const dist2 = dx * dx + dy * dy;
        const dist = Math.sqrt(dist2);

        if (bh.pullForce > 0 && dist > 0.0001) {
          const invDist = 1 / dist;
          const gravity = bh.pullForce / (dist2 + SOFTENING);
          const tangentX = -dy * invDist;
          const tangentY = dx * invDist;
          const spin = bh.spinForce / Math.max(dist, 24);

          particle.vx += dx * invDist * gravity * dt;
          particle.vy += dy * invDist * gravity * dt;
          particle.vx += tangentX * spin * dt;
          particle.vy += tangentY * spin * dt;

          if (bh.phase === 'singularity' && dist < bh.ringR * 1.6) {
            particle.flare = Math.max(particle.flare, clamp(1 - dist / (bh.ringR * 1.6), 0, 1));
          }
        }

        if (state.mouse.inside) {
          const mouseDx = state.mouse.x - particle.x;
          const mouseDy = state.mouse.y - particle.y;
          const mouseDist2 = mouseDx * mouseDx + mouseDy * mouseDy;
          if (mouseDist2 < CURSOR_RADIUS * CURSOR_RADIUS && mouseDist2 > 4) {
            const mouseDist = Math.sqrt(mouseDist2);
            const strength = (1 - mouseDist / CURSOR_RADIUS) * CURSOR_FORCE * particle.depth;
            particle.vx += (mouseDx / mouseDist) * strength * dt;
            particle.vy += (mouseDy / mouseDist) * strength * dt;
          }
        }

        if (Math.random() < dt * 0.12 && bh.phase !== 'forming' && bh.phase !== 'singularity') {
          particle.flare = Math.max(particle.flare, rand(0.12, 0.38));
        }

        const maxSpeed =
          bh.phase === 'exploding'
            ? MAX_EXPLOSION_SPEED
            : bh.phase === 'forming' || bh.phase === 'singularity'
              ? MAX_SINGULARITY_SPEED
              : MAX_IDLE_SPEED;
        const speed = Math.hypot(particle.vx, particle.vy);
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          particle.vx *= scale;
          particle.vy *= scale;
        }

        const damping =
          bh.phase === 'exploding'
            ? 0.2
            : bh.phase === 'settling'
              ? 1.25
              : 0.55 + (1 - particle.depth) * 0.45;
        particle.vx *= 1 - dt * damping;
        particle.vy *= 1 - dt * damping;

        if (bh.phase === 'idle') {
          particle.vx += Math.cos(timeSeconds * 0.22 + particle.twinklePhase) * dt * 1.4 * particle.depth;
          particle.vy += Math.sin(timeSeconds * 0.18 + particle.twinklePhase) * dt * 1.1 * particle.depth;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.flare = Math.max(0, particle.flare - dt * 0.7);

        if (bh.phase !== 'forming' && bh.phase !== 'singularity') {
          if (particle.x < -EDGE_WRAP) particle.x = state.width + EDGE_WRAP;
          if (particle.x > state.width + EDGE_WRAP) particle.x = -EDGE_WRAP;
          if (particle.y < -EDGE_WRAP) particle.y = state.height + EDGE_WRAP;
          if (particle.y > state.height + EDGE_WRAP) particle.y = -EDGE_WRAP;
        }

        drawStar(ctx, particle, timeSeconds, bh);

        if ((bh.phase === 'forming' || bh.phase === 'singularity' || bh.phase === 'exploding') && speed > 28) {
          const trailAlpha =
            clamp((speed / maxSpeed) * 0.22, 0.04, 0.2) *
            (bh.phase === 'exploding' ? 1 : 0.75);
          const color = spectralColor(particle.temperature);
          ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${trailAlpha})`;
          ctx.lineWidth = Math.max(0.5, particle.radius * 0.28);
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * dt * 0.08, particle.y - particle.vy * dt * 0.08);
          ctx.stroke();
        }
      }

      if (state.mouse.inside) {
        const cursorGlow = ctx.createRadialGradient(state.mouse.x, state.mouse.y, 0, state.mouse.x, state.mouse.y, 110);
        cursorGlow.addColorStop(0, 'rgba(255,255,255,0.06)');
        cursorGlow.addColorStop(0.28, 'rgba(96,165,250,0.06)');
        cursorGlow.addColorStop(0.58, 'rgba(245,158,11,0.035)');
        cursorGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(state.mouse.x, state.mouse.y, 110, 0, Math.PI * 2);
        ctx.fill();
      }

      state.raf = requestAnimationFrame(draw);
    };

    stateRef.current.raf = requestAnimationFrame(draw);

    const onResize = () => resize();
    const onVisibilityChange = () => {
      const state = stateRef.current;
      if (!state) return;
      if (document.hidden) {
        cancelAnimationFrame(state.raf);
      } else {
        state.lastTime = performance.now();
        state.raf = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      const state = stateRef.current;
      if (state) cancelAnimationFrame(state.raf);
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
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        zIndex: 1,
      }}
    />
  );
}
