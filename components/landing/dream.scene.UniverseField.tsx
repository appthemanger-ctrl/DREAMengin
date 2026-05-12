'use client';

import { useEffect, useRef } from 'react';
import { n as MOND_N } from '@/lib/torridity/constants';

const MIN_PARTICLES = 10001;
const MAX_PARTICLES = 20001;
const GALAXY_COUNT = Math.floor(Math.random() * 120) + 1; 
const MAX_DPR = 1;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface UniverseFieldProps {
  scaled?: boolean;
}

interface Galaxy {
  seedAngle: number;
  seedDistance: number;
  orbit: number;
  rotation: number;
  spin: number;
  arms: number;
  hue: number;
  tiltX: number;
  tiltY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function hash(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

export default function UniverseField(_props: UniverseFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const canvas = canvasElement;

    const drawingContext = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!drawingContext) return;
    const ctx = drawingContext;

    let { width, height } = resizeCanvas(canvas, ctx);
    let raf = 0;
    let lastNow = performance.now();
    let universeAge = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = reduceMotion
      ? 620
      : clamp(Math.floor((width * height) / 820), MIN_PARTICLES, MAX_PARTICLES);

    const x = new Float32Array(particleCount);
    const y = new Float32Array(particleCount);
    const vx = new Float32Array(particleCount);
    const vy = new Float32Array(particleCount);
    const birthAngle = new Float32Array(particleCount);
    const launchRadius = new Float32Array(particleCount);
    const galaxyIndex = new Uint8Array(particleCount);
    const orbitRadius = new Float32Array(particleCount);
    const orbitPhase = new Float32Array(particleCount);
    const armOffset = new Float32Array(particleCount);
    const size = new Float32Array(particleCount);
    const brightness = new Float32Array(particleCount);
    const color = new Array<string>(particleCount);

    const galaxies: Galaxy[] = Array.from({ length: GALAXY_COUNT }, (_, i) => ({
      seedAngle: -Math.PI / 2 + i * GOLDEN_ANGLE,
      seedDistance: 0.2 + hash(200 + i) * 0.24,
      orbit: hash(300 + i) * TAU,
      rotation: hash(400 + i) * TAU,
      spin: (i % 2 === 0 ? 1 : -1) * (0.08 + hash(500 + i) * 0.09),
      arms: i % 2 === 0 ? 3 : 2,
      hue: [42, 198, 266, 320, 175][i % 5],
      tiltX: 0.72 + hash(600 + i) * 0.42,
      tiltY: 0.42 + hash(700 + i) * 0.36,
    }));

    function seedParticles() {
      const cx = width / 2;
      const cy = height / 2;
      const cloudRadius = Math.min(width, height) * 0.07;

      for (let i = 0; i < particleCount; i++) {
        const a = i * GOLDEN_ANGLE + hash(i) * 0.55;
        const coldDust = hash(i + 10) > 0.82;
        const r = Math.pow(hash(i + 20), 2.8) * cloudRadius;
        const speed = 0.16 + hash(i + 30) * 0.54;
        const jitter = (hash(i + 40) - 0.5) * 0.65;

        x[i] = cx + Math.cos(a) * r;
        y[i] = cy + Math.sin(a) * r;
        vx[i] = Math.cos(a + jitter) * speed;
        vy[i] = Math.sin(a + jitter) * speed;
        birthAngle[i] = a;
        launchRadius[i] = r;
        galaxyIndex[i] = i % GALAXY_COUNT;
        orbitRadius[i] = Math.pow(hash(i + 50), 0.58) * (0.13 + hash(i + 60) * 0.39);
        orbitPhase[i] = hash(i + 70) * TAU;
        armOffset[i] = (hash(i + 80) - 0.5) * (coldDust ? 0.95 : 0.34);
        size[i] = coldDust ? 0.45 + hash(i + 90) * 0.8 : 0.75 + hash(i + 100) * 1.75;
        brightness[i] = coldDust ? 0.32 + hash(i + 110) * 0.45 : 0.58 + hash(i + 120) * 0.42;
        color[i] = coldDust
          ? `hsla(${225 + hash(i + 130) * 70}, 92%, ${64 + hash(i + 140) * 16}%, `
          : `hsla(${34 + hash(i + 150) * 48}, 100%, ${68 + hash(i + 160) * 24}%, `;
      }
    }

    function galaxyCenter(galaxy: Galaxy, expansion: number, drift: number) {
      const radius = Math.min(width, height) * lerp(0.04, galaxy.seedDistance, expansion);
      const slowOrbit = galaxy.seedAngle + Math.sin(drift * 0.11 + galaxy.orbit) * 0.18;
      return {
        x: width / 2 + Math.cos(slowOrbit) * radius * galaxy.tiltX,
        y: height / 2 + Math.sin(slowOrbit) * radius * galaxy.tiltY,
      };
    }

    function paintBackground(ignition: number, expansion: number, formation: number) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(1, 2, 8, ${reduceMotion ? 1 : 0.34})`;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.max(width, height) * lerp(0.22, 0.86, expansion);
      const womb = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      womb.addColorStop(0, `rgba(255, 246, 196, ${0.42 * (1 - formation) + 0.1 * ignition})`);
      womb.addColorStop(0.16, `rgba(255, 118, 64, ${0.24 * (1 - formation)})`);
      womb.addColorStop(0.46, `rgba(85, 72, 255, ${0.17 + 0.08 * ignition})`);
      womb.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = womb;
      ctx.fillRect(0, 0, width, height);

      if (formation > 0.04) {
        ctx.globalCompositeOperation = 'lighter';
        for (const galaxy of galaxies) {
          const center = galaxyCenter(galaxy, expansion, universeAge);
          const glowRadius = Math.min(width, height) * (0.08 + formation * 0.18);
          const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, glowRadius);
          glow.addColorStop(0, `hsla(${galaxy.hue}, 100%, 78%, ${0.16 * formation})`);
          glow.addColorStop(0.38, `hsla(${galaxy.hue + 34}, 100%, 58%, ${0.07 * formation})`);
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(center.x - glowRadius, center.y - glowRadius, glowRadius * 2, glowRadius * 2);
        }
      }
    }

    function updateAndRender(dt: number) {
      universeAge += dt * (reduceMotion ? 0.28 : 1);

      const ignition = smoothstep(0.05, 1.7, universeAge);
      const expansion = smoothstep(1.2, 7.8, universeAge);
      const formation = smoothstep(5.1, 14.8, universeAge);
      const pull = 0.018 + formation * 0.09;
      const cx = width / 2;
      const cy = height / 2;
      const universeScale = Math.min(width, height);
      const safeDt = Math.min(dt, 1 / 30);

      paintBackground(ignition, expansion, formation);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particleCount; i++) {
        const galaxy = galaxies[galaxyIndex[i]];
        const center = galaxyCenter(galaxy, expansion, universeAge);
        const radius = orbitRadius[i] * universeScale * lerp(0.22, 0.95, formation);
        const arm = Math.floor((orbitPhase[i] / TAU) * galaxy.arms);
        const spiralAngle =
          orbitPhase[i] +
          galaxy.rotation +
          universeAge * galaxy.spin +
          radius * 0.018 +
          (arm * TAU) / galaxy.arms;
        const dustWave = Math.sin(universeAge * 0.75 + i * 0.017) * armOffset[i] * (1 - formation * 0.35);
        const spiralX = Math.cos(spiralAngle + dustWave) * radius * galaxy.tiltX;
        const spiralY = Math.sin(spiralAngle + dustWave) * radius * galaxy.tiltY * 0.64;
        const freeRadius = launchRadius[i] + universeScale * (0.08 + orbitRadius[i] * 0.72) * expansion;
        const freeX = cx + Math.cos(birthAngle[i]) * freeRadius;
        const freeY = cy + Math.sin(birthAngle[i]) * freeRadius;
        const targetX = lerp(freeX, center.x + spiralX, formation);
        const targetY = lerp(freeY, center.y + spiralY, formation);

        vx[i] = lerp(vx[i], (targetX - x[i]) * pull, 0.18);
        vy[i] = lerp(vy[i], (targetY - y[i]) * pull, 0.18);
        x[i] += vx[i] * safeDt * 60;
        y[i] += vy[i] * safeDt * 60;

        const depthPulse = 0.72 + Math.sin(universeAge * 1.7 + orbitPhase[i]) * 0.28;
        const alpha = clamp((0.08 + brightness[i] * (0.52 + formation * 0.46)) * depthPulse, 0.05, 0.92);
        const starSize = size[i] * (0.7 + formation * 0.9 + (1 - expansion) * ignition * 1.6);

        ctx.fillStyle = `${color[i]}${alpha})`;
        ctx.fillRect(x[i], y[i], starSize, starSize);

        if (brightness[i] > 0.86 && formation > 0.18) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * formation * alpha})`;
          ctx.fillRect(x[i] - starSize, y[i], starSize * 3, 1);
          ctx.fillRect(x[i], y[i] - starSize, 1, starSize * 3);
        }
      }
    }

    function frame(now: number) {
      const dt = (now - lastNow) / 1000;
      lastNow = now;
      updateAndRender(dt);
      raf = requestAnimationFrame(frame);
    }

    function onResize() {
      const previousWidth = width;
      const previousHeight = height;
      ({ width, height } = resizeCanvas(canvas, ctx));
      const scaleX = width / Math.max(previousWidth, 1);
      const scaleY = height / Math.max(previousHeight, 1);
      for (let i = 0; i < particleCount; i++) {
        x[i] *= scaleX;
        y[i] *= scaleY;
      }
      paintBackground(0, 0, 0);
    }

    seedParticles();
    paintBackground(0, 0, 0);
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
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
