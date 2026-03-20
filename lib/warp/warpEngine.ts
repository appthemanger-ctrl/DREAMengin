/**
 * WarpEngine — a scaled-down, browser-native analogue of NVIDIA Warp.
 *
 * NVIDIA Warp models GPU computation as kernel functions applied in parallel
 * over arrays of data.  This implementation brings the same pattern to the
 * browser using plain TypeScript so that:
 *
 *   - Every effect is expressed as a `WarpKernel` — a pure function that
 *     reads / writes a single `WarpParticle` each call.
 *   - The engine runs all active kernels over every particle on each `step()`.
 *   - No external dependencies are needed; rendering happens in the caller
 *     (see `components/warp/WarpCanvas.tsx`).
 *
 * Kernel naming mirrors Warp's `@wp.kernel` decorator intent: a named,
 * composable compute primitive.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarpVec2 {
  x: number;
  y: number;
}

export interface WarpParticle {
  /** World position (pixels). */
  pos: WarpVec2;
  /** Velocity (pixels / second). */
  vel: WarpVec2;
  /** Remaining normalised life [1 → 0]. */
  life: number;
  /** Decay rate per second (0–1). */
  decay: number;
  /** Particle radius in pixels. */
  radius: number;
  /** CSS colour string. */
  color: string;
  /** Opacity derived from life. */
  opacity: number;
}

/** Execution context passed to every kernel on each step. */
export interface WarpContext {
  /** Seconds elapsed since engine start. */
  time: number;
  /** Delta-time for the current step (seconds). */
  dt: number;
  /** Canvas width in logical pixels. */
  width: number;
  /** Canvas height in logical pixels. */
  height: number;
}

/**
 * A WarpKernel is applied to every particle once per simulation step.
 * It mutates the particle in-place (mirrors Warp's kernel launch semantics).
 */
export type WarpKernel = (particle: WarpParticle, ctx: WarpContext) => void;

/** Named effect presets understood by the engine. */
export type WarpEffect = 'particles' | 'field' | 'flow' | 'orbit';

// ---------------------------------------------------------------------------
// Built-in kernels
// ---------------------------------------------------------------------------

/** Integrate velocity → position. */
export const integrateKernel: WarpKernel = (p, { dt }) => {
  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;
};

/** Decay particle life; push opacity. */
export const decayKernel: WarpKernel = (p, { dt }) => {
  p.life = Math.max(0, p.life - p.decay * dt);
  p.opacity = p.life;
};

/** Gentle downward gravity. */
export const gravityKernel: WarpKernel = (p, { dt }) => {
  const G = 40; // pixels / s²
  p.vel.y += G * dt;
};

/**
 * Turbulence — adds sine-based pseudo-noise to velocity so streams
 * break up organically, similar to a Warp noise kernel.
 */
export const turbulenceKernel: WarpKernel = (p, { time, dt }) => {
  const freq = 0.8;
  const amp  = 18;
  p.vel.x += Math.sin(time * freq + p.pos.y * 0.01) * amp * dt;
  p.vel.y += Math.cos(time * freq + p.pos.x * 0.01) * amp * dt;
};

/**
 * Spiral attractor — pulls particles toward the canvas centre along a
 * tangential arc so they spiral inward (think galaxy simulation).
 */
export const spiralKernel: WarpKernel = (p, { width, height, dt }) => {
  const cx = width  / 2;
  const cy = height / 2;
  const dx = cx - p.pos.x;
  const dy = cy - p.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
  const strength = 60;
  // Centripetal force toward centre
  p.vel.x += (dx / dist) * strength * dt;
  p.vel.y += (dy / dist) * strength * dt;
  // Tangential component for the spin
  p.vel.x += (-dy / dist) * strength * 0.6 * dt;
  p.vel.y += ( dx / dist) * strength * 0.6 * dt;
};

/**
 * Expansion — pushes particles away from the canvas centre (big-bang
 * style).  Useful for the 'field' effect.
 */
export const expansionKernel: WarpKernel = (p, { width, height, dt }) => {
  const cx = width  / 2;
  const cy = height / 2;
  const dx = p.pos.x - cx;
  const dy = p.pos.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
  const strength = 30;
  p.vel.x += (dx / dist) * strength * dt;
  p.vel.y += (dy / dist) * strength * dt;
};

/**
 * Flow field — steers velocity according to a smooth angle field derived
 * from position.  Mimics Warp's array-indexing kernels.
 */
export const flowKernel: WarpKernel = (p, { time, dt }) => {
  const scale = 0.004;
  const angle = Math.sin(p.pos.x * scale + time * 0.4) *
                Math.cos(p.pos.y * scale + time * 0.3) *
                Math.PI * 2;
  const speed = 55;
  p.vel.x += Math.cos(angle) * speed * dt;
  p.vel.y += Math.sin(angle) * speed * dt;
};

/** Dampen velocity so it doesn't grow unbounded. */
export const dampingKernel: WarpKernel = (p, { dt }) => {
  const factor = Math.exp(-2.5 * dt);
  p.vel.x *= factor;
  p.vel.y *= factor;
};

/** Wrap particles that escape the canvas back to the opposite edge. */
export const wrapBoundaryKernel: WarpKernel = (p, { width, height }) => {
  if (p.pos.x < 0)      p.pos.x += width;
  if (p.pos.x > width)  p.pos.x -= width;
  if (p.pos.y < 0)      p.pos.y += height;
  if (p.pos.y > height) p.pos.y -= height;
};

// ---------------------------------------------------------------------------
// Kernel sets per effect
// ---------------------------------------------------------------------------

const EFFECT_KERNELS: Record<WarpEffect, WarpKernel[]> = {
  particles: [gravityKernel, turbulenceKernel, dampingKernel, integrateKernel, decayKernel, wrapBoundaryKernel],
  field:     [expansionKernel, turbulenceKernel, dampingKernel, integrateKernel, decayKernel, wrapBoundaryKernel],
  flow:      [flowKernel, dampingKernel, integrateKernel, decayKernel, wrapBoundaryKernel],
  orbit:     [spiralKernel, dampingKernel, integrateKernel, decayKernel, wrapBoundaryKernel],
};

// ---------------------------------------------------------------------------
// Palette helpers
// ---------------------------------------------------------------------------

const PALETTES: Record<WarpEffect, string[]> = {
  particles: ['#7eb8f7', '#a78bfa', '#38bdf8', '#818cf8', '#c084fc'],
  field:     ['#34d399', '#6ee7b7', '#a3e635', '#4ade80', '#86efac'],
  flow:      ['#f472b6', '#fb7185', '#e879f9', '#c084fc', '#f9a8d4'],
  orbit:     ['#fbbf24', '#fb923c', '#f472b6', '#e879f9', '#a78bfa'],
};

function randomColor(effect: WarpEffect): string {
  const palette = PALETTES[effect];
  return palette[Math.floor(Math.random() * palette.length)];
}

// ---------------------------------------------------------------------------
// Particle factory
// ---------------------------------------------------------------------------

/**
 * Spawn a single particle appropriate for a given effect.
 * Mirrors Warp's `wp.zeros()` / `wp.array()` allocation helpers.
 */
export function spawnParticle(effect: WarpEffect, width: number, height: number): WarpParticle {
  let x = Math.random() * width;
  let y = Math.random() * height;
  let vx = (Math.random() - 0.5) * 80;
  let vy = (Math.random() - 0.5) * 80;

  if (effect === 'particles') {
    // Emit from top edge, drift down
    x  = Math.random() * width;
    y  = -4;
    vx = (Math.random() - 0.5) * 40;
    vy = Math.random() * 30 + 10;
  } else if (effect === 'orbit') {
    // Start near centre
    x = width  / 2 + (Math.random() - 0.5) * 80;
    y = height / 2 + (Math.random() - 0.5) * 80;
  }

  return {
    pos:     { x, y },
    vel:     { x: vx, y: vy },
    life:    0.8 + Math.random() * 0.2,
    decay:   0.04 + Math.random() * 0.06,
    radius:  1 + Math.random() * 2.5,
    color:   randomColor(effect),
    opacity: 1,
  };
}

// ---------------------------------------------------------------------------
// WarpEngine class
// ---------------------------------------------------------------------------

export interface WarpEngineOptions {
  /** Maximum live particles. Default: 320. */
  maxParticles?: number;
  /** Particles to spawn per second. Default: 30. */
  spawnRate?: number;
  /** Initial effect. Default: 'particles'. */
  effect?: WarpEffect;
  /** Extra kernels added on top of the built-in set for the effect. */
  extraKernels?: WarpKernel[];
}

export class WarpEngine {
  readonly maxParticles: number;
  readonly spawnRate:    number;
  effect:                WarpEffect;

  particles: WarpParticle[] = [];

  private kernels:      WarpKernel[];
  private extraKernels: WarpKernel[];
  private time:         number = 0;
  private spawnAccum:   number = 0;
  private width:        number = 800;
  private height:       number = 600;

  constructor(opts: WarpEngineOptions = {}) {
    this.maxParticles = opts.maxParticles ?? 320;
    this.spawnRate    = opts.spawnRate    ?? 30;
    this.effect       = opts.effect       ?? 'particles';
    this.extraKernels = opts.extraKernels ?? [];
    this.kernels      = [...EFFECT_KERNELS[this.effect], ...this.extraKernels];
  }

  /** Resize the simulation domain (call when the canvas is resized). */
  resize(width: number, height: number): void {
    this.width  = width;
    this.height = height;
  }

  /** Switch to a different effect preset and recompile the kernel list. */
  setEffect(effect: WarpEffect): void {
    this.effect  = effect;
    this.kernels = [...EFFECT_KERNELS[effect], ...this.extraKernels];
  }

  /** Remove all live particles. */
  reset(): void {
    this.particles  = [];
    this.spawnAccum = 0;
    this.time       = 0;
  }

  /**
   * Advance the simulation by `dt` seconds.
   * Mirrors Warp's `wp.launch(kernel, dim, inputs, outputs)` semantics:
   * each kernel is launched over every live particle.
   */
  step(dt: number): void {
    this.time += dt;

    const ctx: WarpContext = {
      time:   this.time,
      dt,
      width:  this.width,
      height: this.height,
    };

    // 1. Launch all kernels over every particle (parallel in Warp; sequential here)
    for (const p of this.particles) {
      for (const kernel of this.kernels) {
        kernel(p, ctx);
      }
    }

    // 2. Reap dead particles
    this.particles = this.particles.filter(p => p.life > 0);

    // 3. Spawn new particles if capacity allows
    this.spawnAccum += this.spawnRate * dt;
    const toSpawn = Math.floor(this.spawnAccum);
    this.spawnAccum -= toSpawn;

    const capacity = this.maxParticles - this.particles.length;
    const spawning = Math.min(toSpawn, capacity);
    for (let i = 0; i < spawning; i++) {
      this.particles.push(spawnParticle(this.effect, this.width, this.height));
    }
  }

  /** Elapsed simulation time in seconds. */
  get elapsedTime(): number {
    return this.time;
  }

  /** How full the particle pool is (0–1). */
  get load(): number {
    return this.particles.length / this.maxParticles;
  }
}
