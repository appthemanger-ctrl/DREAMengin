'use client';

import { useEffect, useRef } from 'react';
import { n as MOND_N } from '@/lib/torridity/constants';

const MIN_PARTICLES = 10001;
const MAX_PARTICLES = 20001;
const GALAXY_COUNT = Math.floor(Math.random() * 120) + 1; 
const MAX_DPR = 1;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const LIGHT_PRESSURE_COEFF = 0.00000045; // Minuscule but accounted for

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

export default function UniverseField(_props: UniverseFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    let width = 0, height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let raf = 0;
    let lastNow = performance.now();
    let universeAge = 0;
    const particleCount = clamp(Math.floor((width * height) / 820), MIN_PARTICLES, MAX_PARTICLES);

    // BUFFERS
    const x = new Float32Array(particleCount);
    const y = new Float32Array(particleCount);
    const vx = new Float32Array(particleCount);
    const vy = new Float32Array(particleCount);
    const galaxyIndex = new Uint8Array(particleCount);
    const orbitRadius = new Float32Array(particleCount);
    const orbitPhase = new Float32Array(particleCount);
    const size = new Float32Array(particleCount);
    const brightness = new Float32Array(particleCount);
    const celestialType = new Uint8Array(particleCount); // 0: Star, 1: BH, 2: Pulsar, 3: Binary
    const color = new Array<string>(particleCount);
    const pulseTimer = new Float32Array(particleCount);

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

    function seed() {
      for (let i = 0; i < particleCount; i++) {
        x[i] = hash(i) * width;
        y[i] = hash(i + 1) * height;
        galaxyIndex[i] = i % GALAXY_COUNT;
        orbitRadius[i] = Math.pow(hash(i + 50), 0.58) * (0.13 + hash(i + 60) * 0.39);
        orbitPhase[i] = hash(i + 70) * TAU;
        
        const typeRoll = hash(i + 999);
        if (i % Math.floor(particleCount / GALAXY_COUNT) === 0) {
          celestialType[i] = 1; // Black Hole
          size[i] = 3.5;
          color[i] = `hsla(260, 100%, 2%, `;
        } else if (typeRoll < 0.001) {
          celestialType[i] = 2; // Pulsar
          size[i] = 1.8;
          color[i] = `hsla(190, 100%, 80%, `;
        } else if (typeRoll < 0.05) {
          celestialType[i] = 3; // Binary Member
          size[i] = 0.8;
          color[i] = `hsla(45, 100%, 70%, `;
        } else {
          celestialType[i] = 0;
          size[i] = 0.5 + hash(i) * 1.5;
          color[i] = `hsla(${34 + hash(i) * 50}, 100%, 70%, `;
        }
        brightness[i] = 0.5 + hash(i) * 0.5;
      }
    }

    function update(dt: number) {
      universeAge += dt;
      const formation = smoothstep(5.0, 15.0, universeAge);
      const safeDt = Math.min(dt, 1/30);
      
      // Paint Background
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#010208';
      ctx.fillRect(0, 0, width, height);

      // Nebula Layer (Gas)
      ctx.globalCompositeOperation = 'lighter';
      for (let g = 0; g < GALAXY_COUNT; g += 20) {
        const galaxy = galaxies[g];
        const gx = width / 2 + Math.cos(universeAge * 0.1 + galaxy.orbit) * galaxy.seedDistance * width * 0.3;
        const gy = height / 2 + Math.sin(universeAge * 0.1 + galaxy.orbit) * galaxy.seedDistance * height * 0.3;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 200 * formation);
        grad.addColorStop(0, `hsla(${galaxy.hue}, 100%, 50%, 0.03)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(gx - 200, gy - 200, 400, 400);
      }

      for (let i = 0; i < particleCount; i++) {
        const g = galaxies[galaxyIndex[i]];
        const radius = orbitRadius[i] * Math.min(width, height) * 0.5 * formation;
        const angle = orbitPhase[i] + universeAge * g.spin + radius * 0.001;
        
        const tx = width/2 + Math.cos(angle) * radius * g.tiltX;
        const ty = height/2 + Math.sin(angle) * radius * g.tiltY;

        // Physics: MOND-Inspired + Light Pressure
        const dx = tx - x[i];
        const dy = ty - y[i];
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        
        // Light Pressure (Radiation push from galaxy center)
        const lpX = (dx / dist) * LIGHT_PRESSURE_COEFF * brightness[i];
        const lpY = (dy / dist) * LIGHT_PRESSURE_COEFF * brightness[i];

        vx[i] = lerp(vx[i], dx * 0.05 - lpX, 0.1);
        vy[i] = lerp(vy[i], dy * 0.05 - lpY, 0.1);
        x[i] += vx[i];
        y[i] += vy[i];

        // RENDER WITH GRAVITATIONAL LENSING
        let rx = x[i], ry = y[i];
        for (let j = 0; j < particleCount; j += Math.floor(particleCount/GALAXY_COUNT)) {
          if (celestialType[j] === 1) { // Lensing near Black Holes
            const ldx = x[j] - x[i];
            const ldy = y[j] - y[i];
            const ldist = ldx * ldx + ldy * ldy;
            if (ldist < 2500) {
              const strength = (1.0 - ldist / 2500) * 5;
              rx -= (ldx / Math.sqrt(ldist)) * strength;
              ry -= (ldy / Math.sqrt(ldist)) * strength;
            }
          }
        }

        const alpha = brightness[i] * clamp(universeAge * 0.2, 0, 1);
        ctx.fillStyle = `${color[i]}${alpha})`;
        
        // Pulsar Beams
        if (celestialType[i] === 2) {
          pulseTimer[i] += safeDt * 5;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(pulseTimer[i]);
          ctx.strokeStyle = `rgba(200, 240, 255, ${alpha * 0.5})`;
          ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke();
          ctx.restore();
        }

        ctx.fillRect(rx, ry, size[i], size[i]);
      }
      
      // Cosmic Ray Transient
      if (hash(universeAge) > 0.98) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        const startX = hash(universeAge) * width;
        ctx.moveTo(startX, 0); ctx.lineTo(startX + 100, height);
        ctx.stroke();
      }
    }

    const frame = (now: number) => {
      update((now - lastNow) / 1000);
      lastNow = now;
      raf = requestAnimationFrame(frame);
    };

    seed();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 0 }} />;
}
