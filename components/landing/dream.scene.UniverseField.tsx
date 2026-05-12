'use client';

import { useEffect, useRef } from 'react';
import { n as MOND_N } from '@/lib/torridity/constants';

const MIN_PARTICLES = 10001;
const MAX_PARTICLES = 20001;
const GALAXY_COUNT = Math.floor(Math.random() * 120) + 1; 
const MAX_DPR = 1;
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const LIGHT_PRESSURE_COEFF = 0.00000045;

// ------------------------------------------------------------
// TORRIDITY PHYSICS – Your exact functions
// ------------------------------------------------------------
const a0 = 1.2e-10; // m/s^2 – critical acceleration
const n = MOND_N;   // 2.1

// μ(x) = x / (1 + x^n)^(1/n)
function mu_T(x: number): number {
  return x / Math.pow(1 + Math.pow(x, n), 1 / n);
}

// ν(y) = inverse of μ for spherical symmetry: g = gN * ν(gN/a0)
// ν(y) = ((1 + sqrt(1 + 4 y^{-n})) / 2)^(1/n)
function nu_T(y: number): number {
  if (y <= 0) return 1;
  const inv = Math.pow(y, -n);
  const inner = (1 + Math.sqrt(1 + 4 * inv)) / 2;
  return Math.pow(inner, 1 / n);
}

// Torridity‑corrected acceleration: given Newtonian gN, return actual g
function torridityAccel(gN: number): number {
  const y = gN / a0;
  if (y < 1e-12) return Math.sqrt(a0 * gN); // Deep‑MOND limit: g ~ sqrt(a0 gN)
  return gN * nu_T(y);
}

// ------------------------------------------------------------
// COSMOLOGY FROM YOUR CHARGE‑FLIP THEORY (no ΛCDM placeholder)
// ------------------------------------------------------------
const H0 = 67.4;                // km/s/Mpc, present Hubble rate
const Omega_m0 = 0.315;        // present matter density fraction

// Parameters for the charge‑flip dark energy
const z_flip = 0.7;            // redshift where dark energy starts to dominate
const flip_width = 0.1;        // transition width (your ΔP)
const Omega_L0 = 1 - Omega_m0; // present dark energy fraction

// Dark energy density as function of scale factor a
// Models the charge‑flip: ρ_de(a) = ρ_de0 * (1 + tanh( log(a/a_flip) / ΔP )) / 2
const a_flip = 1 / (1 + z_flip);
function darkEnergyDensity(a: number): number {
  if (a <= 0) return 0;
  const x = Math.log(a / a_flip) / flip_width;
  // Smooth step from 0 to 1 centered at a_flip with width ΔP
  const s = (Math.tanh(x) + 1) / 2;
  return Omega_L0 * s;
}

// Total omega as function of a
function omega_total(a: number): number {
  if (a <= 0) return 1e-6;
  const omega_m = Omega_m0 / a ** 3;
  const omega_de = darkEnergyDensity(a);
  return omega_m + omega_de;
}

// Hubble parameter H(a) in km/s/Mpc
function hubbleFromA(a: number): number {
  return H0 * Math.sqrt(omega_total(a));
}

// Solve for scale factor a(t) by integrating da/dt = a * H(a)
// We'll pre‑compute a table from t=0 to present (13.8 Gyr)
const AGE_STEPS = 2000;
let ageTable: { t: number; a: number }[] = [];

function buildAgeTable() {
  const T_PRESENT = 13.8e9; // years
  const dt = T_PRESENT / AGE_STEPS;
  ageTable = [{ t: 0, a: 1e-6 }];
  let a = 1e-6;
  let t = 0;
  for (let i = 1; i <= AGE_STEPS; i++) {
    const H = hubbleFromA(a);
    const da_dt = a * H; // in km/s/Mpc * a, but units cancel in ratio
    // Convert H from km/s/Mpc to 1/yr: 1 km/s/Mpc = 1.0227e-12 / yr
    const H_yr = H * 1.0227e-12;
    const da = a * H_yr * dt;
    a += da;
    t += dt;
    ageTable.push({ t, a });
  }
  // Normalize so that a(present) = 1 (last entry)
  const a_present = ageTable[AGE_STEPS].a;
  for (let i = 0; i <= AGE_STEPS; i++) {
    ageTable[i].a /= a_present;
  }
}

function getScaleFactor(ageYears: number): number {
  if (ageTable.length === 0) buildAgeTable();
  if (ageYears <= 0) return 0;
  if (ageYears >= ageTable[AGE_STEPS].t) return ageTable[AGE_STEPS].a;
  let lo = 0, hi = AGE_STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ageTable[mid].t <= ageYears) lo = mid;
    else hi = mid;
  }
  const t0 = ageTable[lo].t, a0 = ageTable[lo].a;
  const t1 = ageTable[hi].t, a1 = ageTable[hi].a;
  return a0 + (a1 - a0) * ((ageYears - t0) / (t1 - t0));
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------
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
    
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) return;
    const ctx = context;

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
    let universeAgeYears = 0; // years since Big Bang
    const COSMIC_SPEED = 5e8; // 500 million years per real second – universe evolves in ~30 seconds
    const particleCount = clamp(Math.floor((width * height) / 820), MIN_PARTICLES, MAX_PARTICLES);

    // Buffers
    const x = new Float32Array(particleCount);
    const y = new Float32Array(particleCount);
    const vx = new Float32Array(particleCount);
    const vy = new Float32Array(particleCount);
    const galaxyIdx = new Uint8Array(particleCount);
    const orbitRadius = new Float32Array(particleCount);
    const orbitPhase = new Float32Array(particleCount);
    const size = new Float32Array(particleCount);
    const brightness = new Float32Array(particleCount);
    const celestialType = new Uint8Array(particleCount);
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
        galaxyIdx[i] = i % GALAXY_COUNT;
        orbitRadius[i] = Math.pow(hash(i + 50), 0.58) * (0.13 + hash(i + 60) * 0.39);
        orbitPhase[i] = hash(i + 70) * TAU;
        
        const typeRoll = hash(i + 999);
        if (i % Math.floor(particleCount / GALAXY_COUNT) === 0) {
          celestialType[i] = 1;  // black hole
          size[i] = 3.5;
          color[i] = `hsla(260, 100%, 2%, `;
        } else if (typeRoll < 0.001) {
          celestialType[i] = 2;  // pulsar
          size[i] = 1.8;
          color[i] = `hsla(190, 100%, 80%, `;
        } else if (typeRoll < 0.05) {
          celestialType[i] = 3;  // binary
          size[i] = 0.8;
          color[i] = `hsla(45, 100%, 70%, `;
        } else {
          celestialType[i] = 0;  // star
          size[i] = 0.5 + hash(i) * 1.5;
          color[i] = `hsla(${34 + hash(i) * 50}, 100%, 70%, `;
        }
        brightness[i] = 0.5 + hash(i) * 0.5;
      }
    }

    // Pre‑compute expansion table once
    buildAgeTable();

    function update(dt: number) {
      // Advance cosmic time with speed multiplier
      universeAgeYears += dt * COSMIC_SPEED;
      const a = getScaleFactor(universeAgeYears); // scale factor today = 1
      const formation = smoothstep(5, 15, universeAgeYears / 1e9); // formation over ~10 Gyr

      const safeDt = Math.min(dt, 1/30);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#010208';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      const centerX = width / 2, centerY = height / 2;

      // Galaxy glow – positions expand with a
      const expand = a;
      for (let g = 0; g < GALAXY_COUNT; g++) {
        const galaxy = galaxies[g];
        const baseDist = galaxy.seedDistance * Math.min(width, height) * 0.3;
        const radius = baseDist * expand;
        const angle = universeAgeYears * 0.1 + galaxy.orbit;
        const gx = centerX + Math.cos(angle) * radius;
        const gy = centerY + Math.sin(angle) * radius;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 200 * formation);
        grad.addColorStop(0, `hsla(${galaxy.hue}, 100%, 50%, 0.03)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(gx - 200, gy - 200, 400, 400);
      }

      // Particle dynamics with Torridity gravity
      for (let i = 0; i < particleCount; i++) {
        const g = galaxies[galaxyIdx[i]];
        const radius = orbitRadius[i] * Math.min(width, height) * 0.5 * formation;
        const angle = orbitPhase[i] + universeAgeYears * g.spin + radius * 0.001;
        
        const targetX = centerX + Math.cos(angle) * radius * g.tiltX;
        const targetY = centerY + Math.sin(angle) * radius * g.tiltY;

        const dx = targetX - x[i];
        const dy = targetY - y[i];
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        
        // Newtonian acceleration (arbitrary scale – visual tuning)
        const gN = 0.05;
        const g_actual = torridityAccel(gN);
        const ax = (dx / dist) * g_actual;
        const ay = (dy / dist) * g_actual;
        
        const lpScale = LIGHT_PRESSURE_COEFF * brightness[i];
        const lpX = (dx / dist) * lpScale;
        const lpY = (dy / dist) * lpScale;

        vx[i] = lerp(vx[i], ax - lpX, 0.1);
        vy[i] = lerp(vy[i], ay - lpY, 0.1);
        x[i] += vx[i] * safeDt;
        y[i] += vy[i] * safeDt;

        // Black hole lensing: iterate over galaxies (centers) instead of particles
        let rx = x[i], ry = y[i];
        for (let g = 0; g < galaxies.length; g++) {
          const gx = centerX + Math.cos(galaxies[g].orbit) * (galaxies[g].seedDistance * Math.min(width, height) * 0.3 * expand);
          const gy = centerY + Math.sin(galaxies[g].orbit) * (galaxies[g].seedDistance * Math.min(width, height) * 0.3 * expand);
          const ldx = gx - x[i];
          const ldy = gy - y[i];
          const ldistSq = ldx * ldx + ldy * ldy;
          if (ldistSq < 2500) {
            const strength = (1.0 - ldistSq / 2500) * 5;
            const ldist = Math.sqrt(ldistSq);
            rx -= (ldx / ldist) * strength;
            ry -= (ldy / ldist) * strength;
          }
        }

        const alpha = brightness[i] * clamp(universeAgeYears / 5e9, 0, 1);
        ctx.fillStyle = `${color[i]}${alpha})`;
        
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
      
      // Occasional shooting star effect
      if (hash(universeAgeYears) > 0.98) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        const startX = hash(universeAgeYears) * width;
        ctx.moveTo(startX, 0); ctx.lineTo(startX + 100, height);
        ctx.stroke();
      }
    }

    const frame = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      update(dt);
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

  return (
    <canvas 
      ref={canvasRef} 
      data-mond-n={MOND_N}
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 0 }} 
    />
  );
}
