/**
 * lib/dreamdm/bridgeSeamFlow.ts
 *
 * BRIDGE SEAM FLOW — Pure Physics for the Neural Seam Canvas
 *
 * Zero browser dependencies. Pure functions over plain data structures.
 * All visual state for the NeuralSeamCanvas lives here so it is fully
 * unit-testable outside of React/Canvas.
 *
 * Architecture:
 *   - `createSeamParticle`  — spawn one particle per bridge emission
 *   - `tickParticles`       — advance physics by one frame delta-time (ms)
 *   - `isParticleDead`      — evict particles that have fully faded
 *   - `SEAM_CHANNEL_COLORS` — canonical channel → CSS hex color map
 *   - `createIdleParticle`  — slow ambient heartbeat particles for idle state
 *
 * Each particle represents a single cross-runtime bridge emission. It:
 *   - Originates at a random X position on the seam
 *   - Travels horizontally toward the nearer edge (short burst to exit)
 *   - Oscillates vertically with a sine wave (makes it feel organic)
 *   - Fades from alpha 1 → 0 over its lifespan
 *   - Carries the emission channel's accent color
 */

// ── Channel color palette ──────────────────────────────────────────────────────

/**
 * Canonical channel → CSS hex color map.
 * These match the per-Engin accent colors used across DREAMengin.
 */
export const SEAM_CHANNEL_COLORS: Record<string, string> = {
  code:    '#3b82f6',   // CodeEngin   — blue
  music:   '#a855f7',   // StarMakerEngin — purple
  games:   '#22c55e',   // GameEngin   — green
  game:    '#22c55e',   // alias
  lab:     '#06b6d4',   // LabEngin    — cyan
  brand:   '#f97316',   // BrandingEngin — orange
  content: '#ec4899',   // ContentEngin — pink
  create:  '#ec4899',   // alias
};

/** Default color when the channel is unknown — gold (DREAMengin brand) */
export const SEAM_DEFAULT_COLOR = '#c8981a';

/** Returns the canonical hex color for a bridge channel. */
export function channelColor(channel: string): string {
  return SEAM_CHANNEL_COLORS[channel] ?? SEAM_DEFAULT_COLOR;
}

// ── Particle type ─────────────────────────────────────────────────────────────

export interface SeamParticle {
  /** Unique sequential ID. */
  id: number;
  /**
   * Normalised horizontal position in [0, 1].
   * 0 = left edge of canvas, 1 = right edge.
   */
  x: number;
  /**
   * Vertical offset from the seam center-line, in pixels.
   * Oscillates via sinusoidal motion.
   */
  y: number;
  /** Horizontal velocity in normalised units per millisecond. */
  vx: number;
  /** Phase offset for the sine-wave Y oscillation (radians). */
  phase: number;
  /** Sine frequency for Y oscillation (radians per millisecond). */
  freq: number;
  /** Y oscillation amplitude (pixels). */
  amp: number;
  /** CSS hex color derived from the emission channel. */
  color: string;
  /** Bridge emission channel name (e.g. 'code', 'music'). */
  channel: string;
  /** Opacity: 1 = fully visible, 0 = dead. Decreases over lifetime. */
  alpha: number;
  /** Glow radius multiplier (1 = normal, >1 = flashier burst). */
  glow: number;
  /** Particle radius in pixels. */
  size: number;
  /**
   * Normalised age in [0, 1].
   * Incremented each tick. At 1 the particle is considered dead.
   */
  age: number;
  /**
   * Total lifespan in milliseconds.
   * Longer for idle heartbeat particles, shorter for emission bursts.
   */
  lifespanMs: number;
  /** Whether this is an ambient idle particle (no real emission behind it). */
  isIdle: boolean;
}

// ── Particle factory ──────────────────────────────────────────────────────────

let _nextId = 0;

/**
 * Spawn one SeamParticle for a real bridge emission.
 *
 * The particle originates at a random horizontal position and moves toward the
 * nearer screen edge, fading out over EMISSION_LIFESPAN_MS ms.
 */
export function createSeamParticle(channel: string): SeamParticle {
  const id = _nextId++;
  // Start anywhere in the middle 60% of the canvas.
  const startX = 0.2 + Math.random() * 0.6;
  // Travel toward the nearer edge.
  const direction = startX < 0.5 ? -1 : 1;
  const speed = 0.00035 + Math.random() * 0.0003; // normalised per ms

  return {
    id,
    x: startX,
    y: 0,
    vx: direction * speed,
    phase: Math.random() * Math.PI * 2,
    freq: 0.003 + Math.random() * 0.002, // ~0.003–0.005 rad/ms
    amp: 4 + Math.random() * 8,           // 4–12 px oscillation
    color: channelColor(channel),
    channel,
    alpha: 1,
    glow: 1.4 + Math.random() * 0.6,
    size: 3.5 + Math.random() * 3,
    age: 0,
    lifespanMs: 700 + Math.random() * 300,  // 700–1000 ms
    isIdle: false,
  };
}

/**
 * Spawn one slow ambient idle particle.
 *
 * These drift left-to-right at a low opacity when no real emissions are
 * happening, keeping the seam alive without being distracting.
 */
export function createIdleParticle(startX: number): SeamParticle {
  const id = _nextId++;
  return {
    id,
    x: startX,
    y: 0,
    vx: 0.00004 + Math.random() * 0.00003, // very slow left → right
    phase: Math.random() * Math.PI * 2,
    freq: 0.001 + Math.random() * 0.001,
    amp: 6 + Math.random() * 6,
    color: SEAM_DEFAULT_COLOR,
    channel: 'idle',
    alpha: 0.20 + Math.random() * 0.15,     // subtle
    glow: 0.6,
    size: 2 + Math.random() * 2,
    age: 0,
    lifespanMs: 5000 + Math.random() * 3000, // 5–8 seconds
    isIdle: true,
  };
}

// ── Physics tick ──────────────────────────────────────────────────────────────

/**
 * Advance all particles by `dtMs` milliseconds.
 *
 * Mutates the particle array in place for performance (avoids GC pressure in
 * the rAF loop). Dead particles remain in the array until `evictDeadParticles`
 * removes them.
 */
export function tickParticles(particles: SeamParticle[], dtMs: number): void {
  for (const p of particles) {
    if (p.age >= 1) continue;

    // Advance time.
    p.age = Math.min(1, p.age + dtMs / p.lifespanMs);

    // Horizontal movement.
    p.x += p.vx * dtMs;

    // Vertical oscillation.
    p.y = Math.sin(p.phase + p.freq * p.age * p.lifespanMs) * p.amp;

    // Alpha: hold bright, then fade in the last 40% of life.
    if (p.age < 0.6) {
      p.alpha = p.isIdle ? (0.20 + Math.random() * 0.02) : Math.min(1, p.alpha);
    } else {
      const fadeProgress = (p.age - 0.6) / 0.4; // 0 → 1 during last 40%
      const targetAlpha = p.isIdle ? 0 : 0;
      const startAlpha = p.isIdle ? 0.22 : 1;
      p.alpha = startAlpha + (targetAlpha - startAlpha) * fadeProgress;
    }

    // Glow decays as the particle ages (burst → calm).
    if (!p.isIdle) {
      p.glow = Math.max(0.5, p.glow - dtMs * 0.0015);
    }
  }
}

/**
 * Return true if the particle has expired and can be removed from the array.
 */
export function isParticleDead(p: SeamParticle): boolean {
  return p.age >= 1 || p.alpha <= 0.01 || p.x < -0.05 || p.x > 1.05;
}

/**
 * Remove dead particles from the array.
 * Returns a new array (non-mutating) to make React state updates clean.
 */
export function evictDeadParticles(particles: SeamParticle[]): SeamParticle[] {
  return particles.filter((p) => !isParticleDead(p));
}

/**
 * Reset the internal particle ID counter. Used in tests only.
 * @internal
 */
export function _resetIdCounter(): void {
  _nextId = 0;
}
