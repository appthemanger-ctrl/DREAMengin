'use client';

import { useEffect, useRef } from 'react';
import { mu } from '@/lib/torridity/physics';
import { n as MOND_N } from '@/lib/torridity/constants';

/**
 * UniverseField — landing-page background.
 *
 * A real N-body simulation of ~400 galaxies — not a hand-tuned animation.
 * Per-frame dynamics are a leapfrog integrator over Newtonian gravity with
 * the project's tested torridity MOND modification applied to the
 * acceleration magnitude:
 *
 *     a_N      = G · m_j / (r² + ε²)              (softened Newton)
 *     x        = a_N / a0
 *     boost    = 1 / max(mu(x), eps)              (deep-MOND enhancement)
 *     a_eff    = a_N · boost                       (MOND-modified)
 *
 * In the high-acceleration regime mu(x) → 1 so a_eff → a_N (Newtonian).
 * In the deep-MOND regime mu(x) → x so a_eff → sqrt(G·m·a0)/r — exactly
 * the same flat-rotation-curve physics used inside each galaxy. This is
 * the same MOND-2.1 rule already exercised by lib/torridity for content
 * ranking, repurposed here for inter-galaxy gravity.
 *
 * Galaxy population:
 *
 *   • 12 dwarf galaxies     — small, irregular, no central black hole
 *                             (per real astronomy, dwarfs don't host BHs).
 *   • The rest are spirals  — disk + arms + soft bulge.
 *   • A small fraction       are "active" galaxies that host a tiny central
 *                             black hole and fire occasional bipolar quasar
 *                             jets (~6% of spirals, "here and there").
 *   • Every galaxy carries a faint dark-matter halo whose intensity is
 *     driven by (1 − mu(x_halo)) at its outer edge — galaxies deeper in
 *     the deep-MOND regime show a more pronounced halo, mirroring how
 *     dark-matter dominance scales with MOND deviation.
 *   • There is **no** super-massive black hole at the centre of the field.
 *
 * Performance — designed for iPhone 16 / iOS 26 Safari (60 fps target):
 *
 *   • Each archetype is rendered ONCE at seed time into an offscreen sprite
 *     (halo + bulge + arms + stars all pre-baked). Per-frame draw work is
 *     ~5 ops per galaxy (translate / rotate / drawImage + active overlays).
 *   • Gravity is O(N²): ~160 k force evaluations / frame at GALAXY_COUNT =
 *     400 — comfortably under 10 M ops/s, well within iPhone 16 budget.
 *   • Leapfrog integration is symplectic — long-term energy is bounded so
 *     the simulation stays stable indefinitely.
 *   • Animation is paused while the tab is hidden.
 */

// ── Tunables ─────────────────────────────────────────────────────────────────

/** Total galaxies in the field. Sweet spot for iPhone 16 60 fps. */
const GALAXY_COUNT = 400;
/** Number of forced-dwarf galaxies inside that total. */
const DWARF_COUNT = 12;
/** Fraction of non-dwarf (spiral/elliptical) galaxies that are "active". */
const ACTIVE_FRACTION = 0.06;

/** Stars baked into a single galaxy sprite (cap). */
const STARS_PER_GALAXY_MAX = 36;
/** Inner cutoff so stars don't pile at a galaxy's central singularity (px). */
const R_MIN = 4;
/** Newtonian velocity scale used inside each galaxy before MOND modulation. */
const V0 = 26;
/** Dark-matter halo extent as a multiplier of the visible galaxy radius. */
const HALO_RADIUS_MULT = 2.2;
/**
 * Galaxies appear nearly stationary at screen time-scales in real life.
 * MOND rotation rates would spin them too fast to look real, so the
 * physics-derived ω is scaled down for visible spin only.
 */
const VISIBLE_SPIN_FACTOR = 0.04;

/** Quasar burst cooldown range (seconds) for active galaxies. */
const QUASAR_COOLDOWN_MIN = 9;
const QUASAR_COOLDOWN_MAX = 22;
/** Duration of a single quasar burst (seconds). */
const QUASAR_BURST_DURATION = 1.6;

/** How many distinct archetype sprites to bake per shape category. */
const SPIRAL_ARCHETYPES = 6;
const ELLIPTICAL_ARCHETYPES = 3;
const DWARF_ARCHETYPES = 3;

// ── N-body simulation tunables ───────────────────────────────────────────────

/**
 * Reference viewport size (px). All motion-rate constants below are tuned
 * for this width. At runtime they are scaled by (min(width, height) / REF)
 * so a galaxy traverses the screen in roughly the same wall-clock time on a
 * 390-px iPhone as on a 1920-px desktop. This keeps the simulation feeling
 * alive on a phone — without screen-scaling, real-time would have galaxies
 * crawling for billions of years before anything visibly moved.
 */
const REF_VIEWPORT = 400;

/**
 * Gravitational constant in screen-units (px³ / mass · s²) at REF_VIEWPORT.
 * Tuned so a typical pair of spiral-mass galaxies at ~150 px separation
 * accelerates each other by a few px/s² — produces real but readable motion.
 */
const G_BASE = 220;
/** Plummer-style softening length (px) at REF_VIEWPORT. */
const SOFTENING_BASE = 18;
/**
 * MOND acceleration scale (px/s²) at REF_VIEWPORT. Below this the boost
 * 1/mu(x) takes over, mirroring the deep-MOND regime that flattens
 * galactic rotation curves.
 */
const A0_BASE = 0.22;
/** Hard cap on acceleration magnitude (px/s²) at REF_VIEWPORT. */
const ACCEL_MAX_BASE = 60;
/** Hard cap on speed (px/s) at REF_VIEWPORT — readability guard. */
const SPEED_MAX_BASE = 22;
/** Standard-deviation for initial peculiar velocity (px/s) at REF_VIEWPORT. */
const INITIAL_VELOCITY_SIGMA_BASE = 1.4;

interface SimParams {
  G: number;
  softening: number;
  a0: number;
  accelMax: number;
  speedMax: number;
  initialVelocitySigma: number;
}

/**
 * Recompute simulation parameters for the current viewport so motion rates
 * scale with screen size — phones get the same perceived dynamics as
 * desktops without anyone feeling stuck or things flying off.
 */
function tuneSimParams(width: number, height: number): SimParams {
  const k = Math.max(0.5, Math.min(width, height) / REF_VIEWPORT);
  return {
    G: G_BASE * k,
    softening: SOFTENING_BASE * k,
    a0: A0_BASE * k,
    accelMax: ACCEL_MAX_BASE * k,
    speedMax: SPEED_MAX_BASE * k,
    initialVelocitySigma: INITIAL_VELOCITY_SIGMA_BASE * k,
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

type GalaxyShape = 'spiral' | 'elliptical' | 'dwarf';

interface Archetype {
  shape: GalaxyShape;
  /** Square pixel size of the sprite canvas (already DPR-scaled at draw time). */
  size: number;
  /** Visible disk radius used by the physics & quasar code (in sprite px). */
  radius: number;
  /** MOND scale radius (in sprite px). */
  r0: number;
  /** Rendered offscreen sprite. */
  sprite: HTMLCanvasElement;
}

interface Quasar {
  /** Seconds remaining in the current burst (0 = idle). */
  life: number;
  duration: number;
  /** Jet axis angle (radians) in the galaxy's local frame. */
  angle: number;
  cooldown: number;
}

interface Galaxy {
  archetype: number;
  /** Galaxy centre on the canvas (px). */
  cx: number;
  cy: number;
  /** Velocity (px/s) — integrated by the leapfrog N-body solver. */
  vx: number;
  vy: number;
  /**
   * Simulation mass (arbitrary units). Set proportional to archetype.radius²
   * so spirals/ellipticals dominate the dynamics while dwarfs feel them.
   */
  mass: number;
  /** Per-instance scale jitter so identical archetypes don't read as duplicates. */
  scale: number;
  /** Current on-sky rotation (radians). */
  rotation: number;
  /** Whole-galaxy spin rate (rad/s) derived from MOND, scaled to visible. */
  omega: number;
  /** Active = hosts tiny central BH and fires quasar jets. */
  active: boolean;
  quasar: Quasar | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Standard-normal sample via Box-Muller (used for initial peculiar velocities). */
function randn(): number {
  const u1 = Math.max(Math.random(), 1e-9);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function spectralColor(hue: number): string {
  // Warm-white → blue-white sweep matching real stellar spectra.
  if (hue < 0.25) return '255,222,176';
  if (hue < 0.55) return '255,240,210';
  if (hue < 0.80) return '230,238,255';
  return '186,212,255';
}

/**
 * MOND-modulated angular velocity for a star at radius r within a disk
 * of MOND scale r0. Same rotation-curve law used by the previous
 * GalaxyStarfield, evaluated per-archetype so each shape type flattens at
 * its own characteristic radius.
 */
function omegaFor(r: number, r0: number): number {
  const x = r / Math.max(r0, 1);
  const factor = Math.max(mu(x), 1e-4);
  const v = V0 * Math.sqrt(factor);
  return v / Math.max(r, R_MIN);
}

/**
 * Relaxed Poisson-disk-ish placement: pick `count` centres on the canvas,
 * rejecting candidates that fall within `minDist` of any already-accepted
 * point. Falls back to the best-spaced candidate after a budget of attempts
 * so we never deadlock on small canvases.
 */
function seedGalaxyCentres(
  count: number,
  width: number,
  height: number,
  minDist: number,
): { cx: number; cy: number }[] {
  const placed: { cx: number; cy: number }[] = [];
  const margin = Math.min(width, height) * 0.04;
  const attemptsPerPick = 18;

  for (let i = 0; i < count; i++) {
    let best = { cx: 0, cy: 0, score: -Infinity };
    for (let attempt = 0; attempt < attemptsPerPick; attempt++) {
      const cx = rand(margin, width - margin);
      const cy = rand(margin, height - margin);
      let nearest = Infinity;
      for (const p of placed) {
        const dx = cx - p.cx;
        const dy = cy - p.cy;
        const d = Math.hypot(dx, dy);
        if (d < nearest) nearest = d;
      }
      if (placed.length === 0 || nearest >= minDist) {
        placed.push({ cx, cy });
        best = { cx, cy, score: Infinity };
        break;
      }
      if (nearest > best.score) best = { cx, cy, score: nearest };
    }
    if (best.score !== Infinity && best.score > -Infinity && placed.length === i) {
      placed.push({ cx: best.cx, cy: best.cy });
    }
  }
  return placed;
}

// ── Sprite baking ────────────────────────────────────────────────────────────

/**
 * Bake one galaxy archetype (halo + bulge + stars) into an offscreen canvas.
 * The sprite is drawn centred at (size/2, size/2) and is rotation-symmetric
 * around that point so we can rotate it cheaply at draw time.
 */
function bakeArchetype(shape: GalaxyShape): Archetype {
  // Choose physical parameters per shape.
  let radius: number;
  let starCount: number;
  let tilt: number;        // disk inclination (cos of viewing angle)
  let bulgeIntensity: number;
  let armCount: number;    // 0 → no arms (dwarf/elliptical)
  let armTwist: number;    // logarithmic-spiral twist in radians per radius

  if (shape === 'spiral') {
    radius = rand(28, 52);
    starCount = STARS_PER_GALAXY_MAX;
    tilt = rand(0.3, 0.85);
    bulgeIntensity = 0.55;
    armCount = Math.random() < 0.5 ? 2 : Math.random() < 0.7 ? 3 : 4;
    armTwist = rand(0.7, 1.4);
  } else if (shape === 'elliptical') {
    radius = rand(22, 42);
    starCount = Math.floor(STARS_PER_GALAXY_MAX * 0.6);
    tilt = rand(0.55, 0.95);
    bulgeIntensity = 0.7;
    armCount = 0;
    armTwist = 0;
  } else {
    // dwarf: small, irregular, lower star count, no arms
    radius = rand(12, 22);
    starCount = Math.floor(STARS_PER_GALAXY_MAX * 0.45);
    tilt = rand(0.5, 0.95);
    bulgeIntensity = 0.35;
    armCount = 0;
    armTwist = 0;
  }

  const r0 = radius * 0.45;
  // Sprite must be big enough to hold the dark-matter halo extent.
  const haloR = radius * HALO_RADIUS_MULT;
  const size = Math.ceil(haloR * 2 + 4);
  const cx = size / 2;
  const cy = size / 2;

  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const sctx = sprite.getContext('2d');
  if (!sctx) {
    return { shape, size, radius, r0, sprite };
  }

  // Galaxy palette bias.
  const hueBias = Math.random();

  // 1) Dark-matter halo (very faint outer glow). Physics-driven opacity:
  //    deeper-MOND galaxies (small mu at the halo edge) show more halo.
  const xHalo = haloR / Math.max(r0, 1);
  const darkMatterWeight = Math.max(0, Math.min(1, 1 - mu(xHalo)));
  if (darkMatterWeight > 0.01) {
    const peak = 0.05 * darkMatterWeight;
    const halo = sctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, haloR);
    halo.addColorStop(0, `rgba(150,170,220,${peak})`);
    halo.addColorStop(0.6, `rgba(120,140,200,${peak * 0.45})`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = halo;
    sctx.beginPath();
    sctx.arc(cx, cy, haloR, 0, Math.PI * 2);
    sctx.fill();
  }

  // 2) Soft bulge.
  const bulgeR = Math.max(6, radius * 0.4);
  const bulge = sctx.createRadialGradient(cx, cy, 1, cx, cy, bulgeR);
  bulge.addColorStop(0, `rgba(255,210,150,${0.35 * bulgeIntensity})`);
  bulge.addColorStop(0.45, `rgba(160,130,200,${0.12 * bulgeIntensity})`);
  bulge.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = bulge;
  sctx.beginPath();
  sctx.arc(cx, cy, bulgeR, 0, Math.PI * 2);
  sctx.fill();

  // 3) Stars — distributed by (r, θ); for spirals biased toward arm tracks.
  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const r = R_MIN + Math.pow(u, 0.55) * (radius - R_MIN);
    let theta: number;
    if (armCount > 0) {
      // Snap roughly to a logarithmic-spiral arm to suggest spiral structure.
      const arm = Math.floor(Math.random() * armCount);
      const armAngle = (arm * (Math.PI * 2)) / armCount;
      const armPhase = armAngle + Math.log(Math.max(r, R_MIN) / R_MIN) * armTwist;
      theta = armPhase + rand(-0.35, 0.35);
    } else {
      theta = rand(0, Math.PI * 2);
    }
    const px = cx + Math.cos(theta) * r;
    const py = cy + Math.sin(theta) * r * tilt;
    const size2 = Math.random() > 0.9 ? rand(1.0, 1.7) : rand(0.3, 0.9);
    const alpha = rand(0.45, 0.95);
    const hue = Math.random() * 0.7 + hueBias * 0.3;
    sctx.fillStyle = `rgba(${spectralColor(hue)},${alpha})`;
    sctx.beginPath();
    sctx.arc(px, py, size2, 0, Math.PI * 2);
    sctx.fill();
  }

  return { shape, size, radius, r0, sprite };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function UniverseField() {
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

    let simParams = tuneSimParams(width, height);

    let archetypes: Archetype[] = [];
    let spiralIdx: number[] = [];
    let ellipticalIdx: number[] = [];
    let dwarfIdx: number[] = [];
    let galaxies: Galaxy[] = [];

    function bakeAll() {
      archetypes = [];
      spiralIdx = [];
      ellipticalIdx = [];
      dwarfIdx = [];
      for (let i = 0; i < SPIRAL_ARCHETYPES; i++) {
        spiralIdx.push(archetypes.length);
        archetypes.push(bakeArchetype('spiral'));
      }
      for (let i = 0; i < ELLIPTICAL_ARCHETYPES; i++) {
        ellipticalIdx.push(archetypes.length);
        archetypes.push(bakeArchetype('elliptical'));
      }
      for (let i = 0; i < DWARF_ARCHETYPES; i++) {
        dwarfIdx.push(archetypes.length);
        archetypes.push(bakeArchetype('dwarf'));
      }
    }

    function pickFrom<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function makeGalaxy(cx: number, cy: number, archetypeIdx: number, allowActive: boolean): Galaxy {
      const arche = archetypes[archetypeIdx];
      const scale = rand(0.7, 1.25);
      const rotation = rand(0, Math.PI * 2);
      // Whole-galaxy spin from MOND rotation curve at the half-light radius,
      // scaled to "visible" timescales so it reads as motion not chaos.
      const rHalf = arche.radius * 0.5;
      const omegaPhys = omegaFor(rHalf, arche.r0);
      const omega = omegaPhys * VISIBLE_SPIN_FACTOR * (Math.random() < 0.5 ? -1 : 1);
      const active = allowActive && Math.random() < ACTIVE_FRACTION;
      // Mass ∝ radius² · scale² (luminous-mass proxy). Active galaxies are
      // slightly more massive (BH + larger bulge).
      const radiusEff = arche.radius * scale;
      const mass = radiusEff * radiusEff * (active ? 1.4 : 1);
      // Initial peculiar velocity — small Gaussian draw per axis.
      const vx = randn() * simParams.initialVelocitySigma;
      const vy = randn() * simParams.initialVelocitySigma;
      return {
        archetype: archetypeIdx,
        cx,
        cy,
        vx,
        vy,
        mass,
        scale,
        rotation,
        omega,
        active,
        quasar: active
          ? {
              life: 0,
              duration: QUASAR_BURST_DURATION,
              angle: rand(0, Math.PI * 2),
              cooldown: rand(QUASAR_COOLDOWN_MIN, QUASAR_COOLDOWN_MAX),
            }
          : null,
      };
    }

    function seed() {
      // Min spacing tuned so 400 galaxies fit a phone viewport without overlap.
      const minDist = Math.min(width, height) * 0.022;
      const centres = seedGalaxyCentres(GALAXY_COUNT, width, height, minDist);
      // First DWARF_COUNT centres are forced dwarfs (no BH, no quasar).
      // Shuffle indices so dwarfs are scattered across the field.
      const idx = centres.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
      const dwarfSet = new Set(idx.slice(0, Math.min(DWARF_COUNT, idx.length)));

      galaxies = centres.map((c, i) => {
        if (dwarfSet.has(i)) {
          return makeGalaxy(c.cx, c.cy, pickFrom(dwarfIdx), /*allowActive*/ false);
        }
        // Most non-dwarfs are spirals; ~15% ellipticals (rough cosmic ratio).
        const archeIdx = Math.random() < 0.85 ? pickFrom(spiralIdx) : pickFrom(ellipticalIdx);
        return makeGalaxy(c.cx, c.cy, archeIdx, /*allowActive*/ true);
      });
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
    }

    /** Tiny central black hole for active galaxies — drawn over the sprite. */
    function drawActiveCore(g: Galaxy, arche: Archetype) {
      const coreR = Math.max(1.0, arche.radius * g.scale * 0.06);
      ctx2d.fillStyle = '#000';
      ctx2d.beginPath();
      ctx2d.arc(g.cx, g.cy, coreR, 0, Math.PI * 2);
      ctx2d.fill();
    }

    /** Bipolar quasar jets — drawn over the sprite in canvas coords. */
    function drawQuasar(g: Galaxy, arche: Archetype) {
      const q = g.quasar;
      if (!q || q.life <= 0) return;
      const tNorm = 1 - q.life / q.duration;             // 0 → 1 over the burst
      const env = Math.sin(Math.min(tNorm, 1) * Math.PI); // fast rise, slow decay
      const length = arche.radius * g.scale * 2.4 * Math.min(1, tNorm * 2.4);
      // Apply the galaxy's on-sky rotation so jets pierce its disk plane.
      const baseAngle = q.angle + g.rotation;
      for (const dir of [0, Math.PI]) {
        const ang = baseAngle + dir;
        const ex = g.cx + Math.cos(ang) * length;
        const ey = g.cy + Math.sin(ang) * length;
        const grad = ctx2d.createLinearGradient(g.cx, g.cy, ex, ey);
        grad.addColorStop(0, `rgba(255,240,210,${0.85 * env})`);
        grad.addColorStop(0.25, `rgba(120,200,255,${0.55 * env})`);
        grad.addColorStop(1, 'rgba(20,40,90,0)');
        ctx2d.strokeStyle = grad;
        ctx2d.lineWidth = 1.6 + env * 3.4;
        ctx2d.lineCap = 'round';
        ctx2d.beginPath();
        ctx2d.moveTo(g.cx, g.cy);
        ctx2d.lineTo(ex, ey);
        ctx2d.stroke();
      }
    }

    let raf = 0;
    let last = performance.now();

    /** Pre-allocated accel buffers — reused each frame, no per-frame GC. */
    let ax = new Float32Array(0);
    let ay = new Float32Array(0);

    function ensureAccelBuffers(n: number) {
      if (ax.length !== n) {
        ax = new Float32Array(n);
        ay = new Float32Array(n);
      }
    }

    /**
     * Compute pairwise MOND-modified gravitational accelerations into ax/ay.
     *
     * O(N²) — at GALAXY_COUNT = 400 this is 160 k iterations / frame, well
     * under iPhone 16 budget. Newton's third law halves the work: each pair
     * (i, j) contributes equal-and-opposite acceleration scaled by mass.
     */
    function computeAccelerations() {
      const n = galaxies.length;
      ensureAccelBuffers(n);
      ax.fill(0);
      ay.fill(0);
      const eps2 = simParams.softening * simParams.softening;
      const G = simParams.G;
      const a0 = simParams.a0;
      const aMax = simParams.accelMax;
      for (let i = 0; i < n; i++) {
        const gi = galaxies[i];
        for (let j = i + 1; j < n; j++) {
          const gj = galaxies[j];
          const dx = gj.cx - gi.cx;
          const dy = gj.cy - gi.cy;
          const r2 = dx * dx + dy * dy + eps2;
          const r = Math.sqrt(r2);
          // Newtonian acceleration magnitude on i from j (m_j only).
          const aN_i = (G * gj.mass) / r2;
          // MOND boost: a_eff = a_N / mu(a_N / a0). At low a_N, mu → x = a_N/a0
          // so a_eff → sqrt(G·m·a0)/r — the canonical deep-MOND form.
          const x = aN_i / a0;
          const muX = Math.max(mu(x), 1e-4);
          const aMag_i = Math.min(aN_i / muX, aMax);
          // Same MOND magnitude scaling on j (it sees i's mass instead).
          const aN_j = (G * gi.mass) / r2;
          const xj = aN_j / a0;
          const muXj = Math.max(mu(xj), 1e-4);
          const aMag_j = Math.min(aN_j / muXj, aMax);
          // Direction unit vector (from i toward j, then negate for j toward i).
          const invR = 1 / r;
          const ux = dx * invR;
          const uy = dy * invR;
          ax[i] += aMag_i * ux;
          ay[i] += aMag_i * uy;
          ax[j] -= aMag_j * ux;
          ay[j] -= aMag_j * uy;
        }
      }
    }

    function frame(now: number) {
      let dt = (now - last) / 1000;
      // Clamp dt so a tab regaining focus doesn't catastrophically warp the
      // sim. Below this cap leapfrog stays stable.
      if (dt > 0.05) dt = 0.05;
      last = now;

      // ── Physics step (leapfrog, symplectic) ────────────────────────────
      computeAccelerations();
      const halfDt = dt * 0.5;
      for (let i = 0; i < galaxies.length; i++) {
        // Half-kick.
        const g = galaxies[i];
        g.vx += ax[i] * halfDt;
        g.vy += ay[i] * halfDt;
        // Drift (full).
        g.cx += g.vx * dt;
        g.cy += g.vy * dt;
      }
      computeAccelerations();
      for (let i = 0; i < galaxies.length; i++) {
        const g = galaxies[i];
        // Second half-kick.
        g.vx += ax[i] * halfDt;
        g.vy += ay[i] * halfDt;
        // Soft speed cap so a near miss doesn't slingshot one off-screen.
        const speed2 = g.vx * g.vx + g.vy * g.vy;
        const speedMax = simParams.speedMax;
        if (speed2 > speedMax * speedMax) {
          const k = speedMax / Math.sqrt(speed2);
          g.vx *= k;
          g.vy *= k;
        }
      }

      // ── Render pass ────────────────────────────────────────────────────
      ctx2d.clearRect(0, 0, width, height);

      for (const g of galaxies) {
        const arche = archetypes[g.archetype];
        // Toroidal wrap on screen edges so the patch of universe is seamless.
        const margin = arche.size * g.scale * 0.6;
        if (g.cx < -margin) g.cx = width + margin;
        if (g.cx > width + margin) g.cx = -margin;
        if (g.cy < -margin) g.cy = height + margin;
        if (g.cy > height + margin) g.cy = -margin;

        // Whole-galaxy slow rotation (MOND-derived, visibly throttled).
        g.rotation += g.omega * dt;

        // Quasar lifecycle (active galaxies only).
        if (g.active && g.quasar) {
          const q = g.quasar;
          if (q.life > 0) {
            q.life -= dt;
            if (q.life <= 0) {
              q.life = 0;
              q.cooldown = rand(QUASAR_COOLDOWN_MIN, QUASAR_COOLDOWN_MAX);
            }
          } else {
            q.cooldown -= dt;
            if (q.cooldown <= 0) {
              q.life = q.duration;
              q.angle = rand(0, Math.PI * 2);
            }
          }
        }

        // Sprite blit — the cheap path for 400 galaxies.
        const drawSize = arche.size * g.scale;
        ctx2d.save();
        ctx2d.translate(g.cx, g.cy);
        ctx2d.rotate(g.rotation);
        ctx2d.drawImage(arche.sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx2d.restore();

        // Active-galaxy decorations (dynamic).
        if (g.active) {
          drawActiveCore(g, arche);
          drawQuasar(g, arche);
        }
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

    function onResize() {
      resize();
      // Re-tune motion-rate constants so dynamics stay phone-friendly across
      // device sizes and orientation changes.
      simParams = tuneSimParams(width, height);
      // Sprite sizes don't depend on viewport — only re-seed the layout.
      seed();
    }

    resize();
    bakeAll();
    seed();
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // MOND interpolation exponent + galaxy population recorded for inspection.
      data-mond-n={MOND_N}
      data-galaxy-count={GALAXY_COUNT}
      data-dwarf-count={DWARF_COUNT}
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
