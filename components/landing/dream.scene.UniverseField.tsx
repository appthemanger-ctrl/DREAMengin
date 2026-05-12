'use client';

import { useEffect, useRef } from 'react';
import { n as MOND_N } from '@/lib/torridity/constants';

const MIN_PARTICLES = 10001;
const MAX_PARTICLES = 20001;
const MAX_DPR = 1;
const TAU = Math.PI * 2;
const PRESENT_AGE_YEARS = 13.8e9;
const RESET_AGE_YEARS = 14.6e9;
const FILAMENT_MODE_COUNT = 5;
const WELL_COUNT = 18;

const a0 = 1.2e-10;
const n = MOND_N;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function nuT(y: number): number {
  if (y <= 0) return 1;
  const inv = Math.pow(y, -n);
  const inner = (1 + Math.sqrt(1 + 4 * inv)) / 2;
  return Math.pow(inner, 1 / n);
}

function torridityAccel(gN: number): number {
  const y = gN / a0;
  if (y < 1e-12) return Math.sqrt(a0 * gN);
  return gN * nuT(y);
}

const H0 = 67.4;
const OmegaM0 = 0.315;
const zFlip = 0.7;
const flipWidth = 0.1;
const OmegaL0 = 1 - OmegaM0;
const aFlip = 1 / (1 + zFlip);

function darkEnergyDensity(a: number): number {
  if (a <= 0) return 0;
  const x = Math.log(a / aFlip) / flipWidth;
  return OmegaL0 * (Math.tanh(x) + 1) / 2;
}

function omegaTotal(a: number): number {
  if (a <= 0) return 1e-6;
  return OmegaM0 / Math.pow(a, 3) + darkEnergyDensity(a);
}

let ageTable: { t: number; a: number }[] = [];

function buildAgeTable() {
  const steps = 2000;
  const dt = PRESENT_AGE_YEARS / steps;
  ageTable = [{ t: 0, a: 1e-6 }];
  let a = 1e-6;

  for (let i = 1; i <= steps; i += 1) {
    const h = H0 * Math.sqrt(omegaTotal(a));
    a += a * (h * 1.0227e-12) * dt;
    ageTable.push({ t: i * dt, a });
  }

  const presentA = ageTable[steps].a;
  for (const row of ageTable) row.a /= presentA;
}

function getScaleFactor(ageYears: number) {
  if (ageTable.length === 0) buildAgeTable();
  const maxT = ageTable[ageTable.length - 1].t;
  if (ageYears <= 0) return 0;
  if (ageYears >= maxT) return 1;

  let lo = 0;
  let hi = ageTable.length - 1;

  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ageTable[mid].t <= ageYears) lo = mid;
    else hi = mid;
  }

  return (
    ageTable[lo].a +
    (ageTable[hi].a - ageTable[lo].a) *
      ((ageYears - ageTable[lo].t) / (ageTable[hi].t - ageTable[lo].t))
  );
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

    let width = 0;
    let height = 0;
    let rafId = 0;
    let universeAgeYears = 0;
    let last = performance.now();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const pCount = Math.min(
      Math.max(Math.floor((width * height) / 820), MIN_PARTICLES),
      MAX_PARTICLES,
    );

    const x = new Float32Array(pCount);
    const y = new Float32Array(pCount);
    const vx = new Float32Array(pCount);
    const vy = new Float32Array(pCount);
    const collapse = new Float32Array(pCount);
    const star = new Float32Array(pCount);
    const sizeSeed = new Float32Array(pCount);
    const hueSeed = new Float32Array(pCount);
    const ignition = new Float32Array(pCount);
    const turbulence = new Float32Array(pCount);
    const phase0 = new Float32Array(pCount);

    const wellBaseX = new Float32Array(WELL_COUNT);
    const wellBaseY = new Float32Array(WELL_COUNT);
    const wellDepthSeed = new Float32Array(WELL_COUNT);
    const wellHueSeed = new Float32Array(WELL_COUNT);
    const wellSpinSeed = new Float32Array(WELL_COUNT);
    const wellPhase = new Float32Array(WELL_COUNT);
    const wellX = new Float32Array(WELL_COUNT);
    const wellY = new Float32Array(WELL_COUNT);
    const wellDepth = new Float32Array(WELL_COUNT);
    const wellSpin = new Float32Array(WELL_COUNT);

    const modeDirX = new Float32Array(FILAMENT_MODE_COUNT);
    const modeDirY = new Float32Array(FILAMENT_MODE_COUNT);
    const modeFreq = new Float32Array(FILAMENT_MODE_COUNT);
    const modeAmp = new Float32Array(FILAMENT_MODE_COUNT);
    const modePhase = new Float32Array(FILAMENT_MODE_COUNT);
    const modeDrift = new Float32Array(FILAMENT_MODE_COUNT);

    for (let m = 0; m < FILAMENT_MODE_COUNT; m += 1) {
      const angle = hash(5000 + m) * TAU;
      modeDirX[m] = Math.cos(angle);
      modeDirY[m] = Math.sin(angle);
      modeFreq[m] = 5.5 + hash(5100 + m) * 7.5;
      modeAmp[m] = 0.65 + hash(5200 + m) * 0.85;
      modePhase[m] = hash(5300 + m) * TAU;
      modeDrift[m] = (hash(5400 + m) - 0.5) * 1.2;
    }

    for (let w = 0; w < WELL_COUNT; w += 1) {
      const angle = hash(3000 + w) * TAU;
      const radius = Math.pow(hash(3100 + w), 0.82);
      wellBaseX[w] = Math.cos(angle) * radius;
      wellBaseY[w] = Math.sin(angle) * radius;
      wellDepthSeed[w] = hash(3200 + w);
      wellHueSeed[w] = hash(3300 + w);
      wellSpinSeed[w] = hash(3400 + w);
      wellPhase[w] = hash(3500 + w) * TAU;
    }

    const initializeParticles = () => {
      const cx = width / 2;
      const cy = height / 2;
      const dim = Math.min(width, height);

      for (let i = 0; i < pCount; i += 1) {
        const angle = hash(i + 1) * TAU;
        const radius = Math.pow(hash(i + 2), 3.4) * dim * 0.028;
        const cross = (hash(i + 3) - 0.5) * dim * 0.008;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const tangentX = -dirY;
        const tangentY = dirX;
        const burst = 90 + Math.pow(hash(i + 4), 0.3) * 260;
        const tangential = (hash(i + 5) - 0.5) * 110;

        x[i] = cx + dirX * radius + tangentX * cross;
        y[i] = cy + dirY * radius + tangentY * cross;
        vx[i] = dirX * burst + tangentX * tangential;
        vy[i] = dirY * burst + tangentY * tangential;
        collapse[i] = 0;
        star[i] = 0;
        sizeSeed[i] = 0.55 + hash(i + 6) * 1.35;
        hueSeed[i] = hash(i + 7);
        ignition[i] = 0.26 + hash(i + 8) * 0.34;
        turbulence[i] = 0.4 + hash(i + 9) * 1.55;
        phase0[i] = hash(i + 10) * TAU;
      }
    };

    initializeParticles();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      universeAgeYears += dt * 5.8e8;

      if (universeAgeYears > RESET_AGE_YEARS) {
        universeAgeYears = 0;
        initializeParticles();
      }

      const cosmicAge = Math.min(universeAgeYears, PRESENT_AGE_YEARS);
      const t = clamp01(cosmicAge / PRESENT_AGE_YEARS);
      const scaleFactor = Math.max(getScaleFactor(cosmicAge), 1e-6);
      const bang = 1 - smoothstep(0.04, 0.12, t);
      const recombination = smoothstep(0.08, 0.26, t);
      const structure = smoothstep(0.18, 0.45, t);
      const starEra = smoothstep(0.38, 0.64, t);
      const mature = smoothstep(0.58, 0.82, t);
      const lateExpansion = smoothstep(0.82, 1, t);
      const cosmicTime = cosmicAge / 1e9;
      const sDt = Math.min(dt, 1 / 30);
      const cx = width / 2;
      const cy = height / 2;
      const dim = Math.min(width, height);
      const dim2 = dim * dim;
      const mondStrength = Math.min(torridityAccel(0.04 + structure * 0.08) * 8e10, 20);

      const background = ctx.createLinearGradient(0, 0, 0, height);
      background.addColorStop(
        0,
        `hsl(${lerp(12, 220, recombination) - lateExpansion * 10}, ${95 - mature * 25}%, ${
          7 + bang * 34 + structure * 9 + starEra * 4
        }%)`,
      );
      background.addColorStop(
        1,
        `hsl(${lerp(2, 244, recombination)}, ${82 - lateExpansion * 16}%, ${
          2 + bang * 15 + starEra * 8 + mature * 3
        }%)`,
      );
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      if (bang > 0.01) {
        ctx.fillStyle = `hsla(${18 + recombination * 14}, 100%, ${28 + bang * 18}%, ${0.05 + bang * 0.18})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (recombination > 0.04) {
        const coolingWash = ctx.createLinearGradient(0, 0, width, height);
        coolingWash.addColorStop(0, `hsla(${28 + recombination * 24}, 100%, 60%, ${0.03 + bang * 0.05})`);
        coolingWash.addColorStop(1, `hsla(${208 + recombination * 24}, 100%, 64%, ${0.015 + recombination * 0.06})`);
        ctx.fillStyle = coolingWash;
        ctx.fillRect(0, 0, width, height);
      }

      const vignette = ctx.createRadialGradient(cx, cy, dim * 0.18, cx, cy, dim * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.48)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      const blast = ctx.createRadialGradient(cx, cy, 0, cx, cy, dim * (0.1 + 0.88 * Math.pow(scaleFactor, 0.5)));
      blast.addColorStop(0, `hsla(${18 + recombination * 10}, 100%, ${80 - recombination * 14}%, ${0.82 * bang + 0.22})`);
      blast.addColorStop(0.42, `hsla(${28 + recombination * 18}, 100%, ${58 - recombination * 10}%, ${0.42 * bang + 0.14})`);
      blast.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = blast;
      ctx.fillRect(cx - dim, cy - dim, dim * 2, dim * 2);

      const shockwave = ctx.createRadialGradient(
        cx,
        cy,
        dim * (0.12 + scaleFactor * 0.05),
        cx,
        cy,
        dim * (0.22 + scaleFactor * 0.4),
      );
      shockwave.addColorStop(0, `hsla(${40 + recombination * 24}, 100%, 76%, ${0.12 + bang * 0.16})`);
      shockwave.addColorStop(0.35, `hsla(${52 + recombination * 20}, 100%, 62%, ${0.06 + bang * 0.08})`);
      shockwave.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shockwave;
      ctx.fillRect(cx - dim, cy - dim, dim * 2, dim * 2);

      ctx.globalCompositeOperation = 'lighter';

      for (let w = 0; w < WELL_COUNT; w += 1) {
        const spread = 0.06 + scaleFactor * 1.04;
        const drift = Math.sin(cosmicTime * 0.22 + wellPhase[w]) * dim * 0.022 * bang;
        const stretch = 0.74 + 0.16 * Math.sin(cosmicTime * 0.18 + wellPhase[w] * 0.7);
        const baseRadius = (0.1 + Math.pow(wellDepthSeed[w], 0.84) * 0.84) * dim;

        wellX[w] = cx + wellBaseX[w] * baseRadius * spread + wellBaseY[w] * drift;
        wellY[w] = cy + wellBaseY[w] * baseRadius * spread * stretch - wellBaseX[w] * drift;
        wellDepth[w] = clamp01(structure * (0.24 + wellDepthSeed[w] * 0.88));
        wellSpin[w] = ((wellSpinSeed[w] - 0.5) * 2) * (0.18 + mature * 0.92);

        if (wellDepth[w] > 0.05) {
          const glowRadius = dim * (0.03 + wellDepth[w] * 0.12) * (0.3 + starEra * 1.1);
          const nebula = ctx.createRadialGradient(wellX[w], wellY[w], 0, wellX[w], wellY[w], glowRadius);
          nebula.addColorStop(
            0,
            `hsla(${190 + wellHueSeed[w] * 120}, 100%, ${52 + wellDepth[w] * 16}%, ${
              0.05 + wellDepth[w] * 0.09 * starEra
            })`,
          );
          nebula.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = nebula;
          ctx.fillRect(wellX[w] - glowRadius, wellY[w] - glowRadius, glowRadius * 2, glowRadius * 2);
        }
      }

      if (structure > 0.08) {
        ctx.lineCap = 'round';

        for (let w = 0; w < WELL_COUNT; w += 1) {
          const next = (w + 5) % WELL_COUNT;
          const webStrength = Math.min(wellDepth[w], wellDepth[next]) * structure;
          if (webStrength < 0.08) continue;

          const midX = (wellX[w] + wellX[next]) * 0.5 + (wellY[next] - wellY[w]) * 0.08;
          const midY = (wellY[w] + wellY[next]) * 0.5 - (wellX[next] - wellX[w]) * 0.08;
          const hue = 190 + ((wellHueSeed[w] + wellHueSeed[next]) * 0.5) * 120;

          ctx.strokeStyle = `hsla(${hue}, 100%, ${58 + webStrength * 12}%, ${0.025 + webStrength * 0.08})`;
          ctx.lineWidth = 0.6 + webStrength * 1.4;
          ctx.beginPath();
          ctx.moveTo(wellX[w], wellY[w]);
          ctx.quadraticCurveTo(midX, midY, wellX[next], wellY[next]);
          ctx.stroke();
        }
      }

      for (let i = 0; i < pCount; i += 1) {
        const px = x[i];
        const py = y[i];
        const fromCenterX = px - cx;
        const fromCenterY = py - cy;
        const radius = Math.hypot(fromCenterX, fromCenterY) + 1;
        const dirX = fromCenterX / radius;
        const dirY = fromCenterY / radius;

        let ax = dirX * (88 * bang + 26 * (1 - starEra) + 34 * lateExpansion * (1 - collapse[i] * 0.8));
        let ay = dirY * (88 * bang + 26 * (1 - starEra) + 34 * lateExpansion * (1 - collapse[i] * 0.8));

        const noisePhase = phase0[i] + cosmicTime * (0.8 + turbulence[i] * 0.95);
        const turbulenceAmp = 78 * bang + 24 * (1 - mature) + 8;
        ax += (Math.sin(noisePhase + fromCenterY * 0.005) * 1.2 + Math.cos(noisePhase * 0.7)) * turbulenceAmp;
        ay += (Math.cos(noisePhase + fromCenterX * 0.005) * 1.2 + Math.sin(noisePhase * 0.8)) * turbulenceAmp;

        let density = 0;
        let strongestDensity = 0;
        let bestDx = 0;
        let bestDy = 0;
        let bestD2 = 0;
        let bestSpin = 0;
        const normX = fromCenterX / dim;
        const normY = fromCenterY / dim;

        for (let m = 0; m < FILAMENT_MODE_COUNT; m += 1) {
          const dot =
            (normX * modeDirX[m] + normY * modeDirY[m]) * modeFreq[m] +
            modePhase[m] +
            cosmicTime * modeDrift[m];
          const ridge = Math.sin(dot);
          const gradient = Math.cos(dot) * modeAmp[m];
          density += (ridge * 0.5 + 0.5) * modeAmp[m] * 0.11 * structure;
          ax += modeDirX[m] * gradient * structure * 44;
          ay += modeDirY[m] * gradient * structure * 44;
        }

        for (let w = 0; w < WELL_COUNT; w += 1) {
          const dx = wellX[w] - px;
          const dy = wellY[w] - py;
          const d2 = dx * dx + dy * dy;
          const densityInfluence = wellDepth[w] / (1 + d2 / (dim2 * (0.007 + 0.04 * structure)));
          const gravity = wellDepth[w] / (d2 + dim2 * 0.0016);

          density += densityInfluence;
          ax += dx * gravity * (8 + mondStrength * 1.35) * structure;
          ay += dy * gravity * (8 + mondStrength * 1.35) * structure;

          if (densityInfluence > strongestDensity) {
            strongestDensity = densityInfluence;
            bestDx = dx;
            bestDy = dy;
            bestD2 = d2;
            bestSpin = wellSpin[w];
          }
        }

        const normalizedDensity = clamp01(density / (0.8 + structure * 2.7));
        const collapseTarget = clamp01((normalizedDensity - 0.14) * (1.1 + structure * 1.9));
        collapse[i] += (collapseTarget - collapse[i]) * (0.02 + structure * 0.055);

        if (strongestDensity > 0.08 && mature > 0) {
          const invBest = 1 / (Math.sqrt(bestD2) + 1);
          ax += -bestDy * invBest * bestSpin * strongestDensity * mature * 26;
          ay += bestDx * invBest * bestSpin * strongestDensity * mature * 26;
        }

        const starTarget =
          starEra * clamp01((collapse[i] - ignition[i]) * 3.8 + (starEra - 0.18) * 0.75);
        star[i] += (starTarget - star[i]) * (0.012 + starEra * 0.065);

        const damping = 0.965 - bang * 0.02 - structure * 0.008 + mature * 0.012;
        vx[i] = (vx[i] + ax * sDt) * damping;
        vy[i] = (vy[i] + ay * sDt) * damping;
        x[i] += vx[i] * sDt;
        y[i] += vy[i] * sDt;

        let rx = x[i];
        let ry = y[i];

        if (mature > 0 && strongestDensity > 0.22) {
          const lens = strongestDensity * mature * 4.2;
          const invBest = 1 / (Math.sqrt(bestD2) + 1);
          rx -= bestDx * invBest * lens;
          ry -= bestDy * invBest * lens;
        }

        if (rx < -24 || ry < -24 || rx > width + 24 || ry > height + 24) continue;

        const dustAlpha =
          (0.13 + bang * 0.85 + recombination * 0.28 + structure * 0.34) *
          (1 - star[i] * 0.96) *
          (0.4 + normalizedDensity * 0.8);
        const dustSize = sizeSeed[i] * (0.8 + bang * 1.15 + collapse[i] * 0.75);

        if (dustAlpha > 0.01) {
          const dustHue = lerp(20 + hueSeed[i] * 9, 205 + hueSeed[i] * 32, recombination);
          const dustLight = 38 + bang * 34 - recombination * 8 + normalizedDensity * 14;
          ctx.fillStyle = `hsla(${dustHue}, ${84 - recombination * 18}%, ${dustLight}%, ${Math.min(
            dustAlpha,
            1,
          )})`;
          ctx.fillRect(rx, ry, dustSize, dustSize);
        }

        const starAlpha = star[i] * (0.28 + collapse[i] * 1.12);
        if (starAlpha > 0.01) {
          const stellarHue =
            star[i] < 0.55
              ? 30 + hueSeed[i] * 24
              : 24 + hueSeed[i] * 220;
          const stellarLight = 58 + collapse[i] * 26 + star[i] * 10;
          const stellarSize = sizeSeed[i] * (0.8 + collapse[i] * 0.95 + star[i] * 2.1);

          ctx.fillStyle = `hsla(${stellarHue}, 100%, ${stellarLight}%, ${Math.min(starAlpha, 1)})`;
          ctx.fillRect(rx - stellarSize * 0.2, ry - stellarSize * 0.2, stellarSize, stellarSize);

          if (starAlpha > 0.22) {
            const haloSize = stellarSize * (2.2 + star[i] * 1.4);
            ctx.fillStyle = `hsla(${stellarHue}, 100%, ${Math.min(stellarLight + 8, 95)}%, ${starAlpha * 0.26})`;
            ctx.fillRect(rx - haloSize * 0.5, ry - haloSize * 0.5, haloSize, haloSize);
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      for (let w = 0; w < WELL_COUNT; w += 1) {
        const coreStrength = wellDepth[w] * mature;
        if (coreStrength < 0.26) continue;

        const coreRadius = dim * (0.006 + coreStrength * 0.018);
        const hue = 190 + wellHueSeed[w] * 120;

        if (coreStrength > 0.68) {
          const isPulsar = Math.abs(wellSpin[w]) > 0.58;

          if (!isPulsar) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.68 + coreStrength * 0.2})`;
            ctx.beginPath();
            ctx.arc(wellX[w], wellY[w], coreRadius * 0.95, 0, TAU);
            ctx.fill();
          }

          ctx.globalCompositeOperation = 'lighter';

          if (isPulsar) {
            const pulse = 0.45 + 0.55 * Math.sin(cosmicTime * 7 + wellPhase[w] * 6);
            const beam = coreRadius * (10 + pulse * 8);
            ctx.strokeStyle = `hsla(${hue}, 100%, 78%, ${0.08 + pulse * 0.18})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(wellX[w] - beam, wellY[w] - beam * 0.25);
            ctx.lineTo(wellX[w] + beam, wellY[w] + beam * 0.25);
            ctx.moveTo(wellX[w] - beam * 0.18, wellY[w] + beam);
            ctx.lineTo(wellX[w] + beam * 0.18, wellY[w] - beam);
            ctx.stroke();
          } else {
            const ring = ctx.createRadialGradient(
              wellX[w],
              wellY[w],
              coreRadius * 0.8,
              wellX[w],
              wellY[w],
              coreRadius * 4.2,
            );
            ring.addColorStop(0, `hsla(${hue}, 100%, 76%, 0.02)`);
            ring.addColorStop(0.35, `hsla(${hue}, 100%, 78%, ${0.08 + coreStrength * 0.12})`);
            ring.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = ring;
            ctx.fillRect(
              wellX[w] - coreRadius * 4.4,
              wellY[w] - coreRadius * 4.4,
              coreRadius * 8.8,
              coreRadius * 8.8,
            );
          }
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    frame(last);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
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
