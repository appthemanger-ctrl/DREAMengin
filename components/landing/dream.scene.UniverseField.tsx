'use client';

import { useEffect, useRef } from 'react';
import { n as MOND_N } from '@/lib/torridity/constants';

const MIN_PARTICLES = 10001;
const MAX_PARTICLES = 20001;
const GALAXY_COUNT = Math.floor(Math.random() * 120) + 1; 
const MAX_DPR = 1;
const TAU = Math.PI * 2;

// --- TORRIDITY & COSMOLOGY (ALL LOGIC RESTORED) ---
const a0 = 1.2e-10;
const n = MOND_N;
const LIGHT_PRESSURE_COEFF = 0.00000045; 

function nu_T(y: number): number {
  if (y <= 0) return 1;
  const inv = Math.pow(y, -n);
  const inner = (1 + Math.sqrt(1 + 4 * inv)) / 2;
  return Math.pow(inner, 1 / n);
}

function torridityAccel(gN: number): number {
  const y = gN / a0;
  if (y < 1e-12) return Math.sqrt(a0 * gN);
  return gN * nu_T(y);
}

const H0 = 67.4;
const Omega_m0 = 0.315;
const z_flip = 0.7;
const flip_width = 0.1;
const Omega_L0 = 1 - Omega_m0;
const a_flip = 1 / (1 + z_flip);

function darkEnergyDensity(a: number): number {
  if (a <= 0) return 0;
  const x = Math.log(a / a_flip) / flip_width;
  return Omega_L0 * (Math.tanh(x) + 1) / 2;
}

function omega_total(a: number): number {
  if (a <= 0) return 1e-6;
  return (Omega_m0 / Math.pow(a, 3)) + darkEnergyDensity(a);
}

let ageTable: { t: number; a: number }[] = [];
function buildAgeTable() {
  const T_PRESENT = 13.8e9;
  const steps = 2000;
  const dt = T_PRESENT / steps;
  ageTable = [{ t: 0, a: 1e-6 }];
  let a = 1e-6;
  for (let i = 1; i <= steps; i++) {
    const H = H0 * Math.sqrt(omega_total(a));
    a += a * (H * 1.0227e-12) * dt;
    ageTable.push({ t: i * dt, a });
  }
  const a_p = ageTable[steps].a;
  ageTable.forEach(row => row.a /= a_p);
}

function getScaleFactor(ageYears: number): number {
  if (ageTable.length === 0) buildAgeTable();
  const maxT = ageTable[ageTable.length - 1].t;
  if (ageYears <= 0) return 0;
  if (ageYears >= maxT) return 1;
  let lo = 0, hi = ageTable.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ageTable[mid].t <= ageYears) lo = mid;
    else hi = mid;
  }
  return ageTable[lo].a + (ageTable[hi].a - ageTable[lo].a) * ((ageYears - ageTable[lo].t) / (ageTable[hi].t - ageTable[lo].t));
}

function hash(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function UniverseField() {
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let universeAgeYears = 0;
    const COSMIC_SPEED = 5e8;
    const pCount = Math.min(Math.max(Math.floor((width * height) / 820), MIN_PARTICLES), MAX_PARTICLES);

    const x = new Float32Array(pCount), y = new Float32Array(pCount);
    const vx = new Float32Array(pCount), vy = new Float32Array(pCount);
    const gIdx = new Uint8Array(pCount), oRad = new Float32Array(pCount);
    const oPhase = new Float32Array(pCount), sz = new Float32Array(pCount);
    const bright = new Float32Array(pCount), cType = new Uint8Array(pCount);
    const pulse = new Float32Array(pCount);
    const colors = new Array<string>(pCount);

    const galaxies = Array.from({ length: GALAXY_COUNT }, (_, i) => ({
      orbit: hash(300 + i) * TAU,
      dist: 0.2 + hash(200 + i) * 0.24,
      spin: (i % 2 === 0 ? 1 : -1) * (0.08 + hash(500 + i) * 0.09),
      hue: [42, 198, 266, 320, 175][i % 5],
      tX: 0.72 + hash(600 + i) * 0.42,
      tY: 0.42 + hash(700 + i) * 0.36,
    }));

    for (let i = 0; i < pCount; i++) {
      x[i] = hash(i) * width; y[i] = hash(i + 1) * height;
      gIdx[i] = i % GALAXY_COUNT;
      oRad[i] = Math.pow(hash(i + 50), 0.58) * (0.13 + hash(i + 60) * 0.39);
      oPhase[i] = hash(i + 70) * TAU;
      const roll = hash(i + 999);
      
      if (i % Math.floor(pCount / GALAXY_COUNT) === 0) {
        cType[i] = 1; sz[i] = 4; colors[i] = `hsla(260, 100%, 0%, `; // Black Hole
      } else {
        cType[i] = roll < 0.002 ? 2 : (roll < 0.05 ? 3 : 0);
        sz[i] = cType[i] === 2 ? 2.5 : (cType[i] === 3 ? 1.2 : 0.8 + hash(i) * 1.5);
        colors[i] = `hsla(${34 + hash(i) * 50}, 100%, 98%, `;
      }
      bright[i] = 0.7 + hash(i) * 0.3;
    }

    const gxArr = new Float32Array(GALAXY_COUNT), gyArr = new Float32Array(GALAXY_COUNT);
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      universeAgeYears += dt * COSMIC_SPEED;
      const a = getScaleFactor(universeAgeYears);
      const form = Math.min(Math.max((universeAgeYears / 1e9 - 5) / 10, 0), 1);
      const sDt = Math.min(dt, 0.033);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#010208';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      const cx = width / 2, cy = height / 2;
      const dim = Math.min(width, height);

      // 1. Update Galaxy Centers
      for (let g = 0; g < GALAXY_COUNT; g++) {
        const gal = galaxies[g];
        const r = gal.dist * dim * 0.3 * a;
        const ang = universeAgeYears * 0.1 + gal.orbit;
        gxArr[g] = cx + Math.cos(ang) * r;
        gyArr[g] = cy + Math.sin(ang) * r;
        
        if (g % 10 === 0) {
          const grad = ctx.createRadialGradient(gxArr[g], gyArr[g], 0, gxArr[g], gyArr[g], 200 * form);
          grad.addColorStop(0, `hsla(${gal.hue}, 100%, 60%, 0.05)`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(gxArr[g] - 200, gyArr[g] - 200, 400, 400);
        }
      }

      // 2. Update Particles
      for (let i = 0; i < pCount; i++) {
        const gal = galaxies[gIdx[i]];
        const r = oRad[i] * dim * 0.5 * form;
        const ang = oPhase[i] + universeAgeYears * gal.spin;
        const tx = cx + Math.cos(ang) * r * gal.tX;
        const ty = cy + Math.sin(ang) * r * gal.tY;

        const dx = tx - x[i], dy = ty - y[i];
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const gAct = torridityAccel(0.05);
        
        vx[i] += ((dx / d) * gAct - (dx / d) * LIGHT_PRESSURE_COEFF * bright[i]) * 0.1;
        vy[i] += ((dy / d) * gAct - (dy / d) * LIGHT_PRESSURE_COEFF * bright[i]) * 0.1;
        vx[i] *= 0.92; vy[i] *= 0.92;
        x[i] += vx[i] * sDt; y[i] += vy[i] * sDt;

        let rx = x[i], ry = y[i];
        let pSz = sz[i];

        if (cType[i] === 2) { // Pulsar Glow
          pulse[i] += sDt * 10;
          pSz *= (1 + Math.sin(pulse[i]) * 0.5);
        }

        // Lensing Restored
        for (let g = 0; g < GALAXY_COUNT; g += 12) {
          const ldx = gxArr[g] - rx, ldy = gyArr[g] - ry;
          const ld2 = ldx * ldx + ldy * ldy;
          if (ld2 < 2500) {
            const s = (1.0 - ld2 / 2500) * 5;
            const ld = Math.sqrt(ld2) + 0.1;
            rx -= (ldx / ld) * s; ry -= (ldy / ld) * s;
          }
        }

        const alpha = bright[i] * Math.min(universeAgeYears / 5e9, 1);
        ctx.fillStyle = colors[i] + alpha + ')';
        ctx.fillRect(rx, ry, pSz, pSz);
      }
      requestAnimationFrame(frame);
    };

    const raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      data-mond-n={MOND_N}
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 0 }} 
    />
  );
}
