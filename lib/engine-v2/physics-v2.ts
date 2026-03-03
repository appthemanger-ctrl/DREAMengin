// lib/engine-v2/physics-v2.ts
// Phase 3 — Physics upgrade: XPBD option, constraint compliance, improved sleeping,
// contact manifold persistence, CCD flag, friction/restitution mixing, penetration clamp.
// Pure module — no React, no DOM dependencies.

import { fpSafe } from './determinism';

// ---------------------------------------------------------------------------
// Physics mode
// ---------------------------------------------------------------------------

export type PhysicsMode = 'sequential-impulse' | 'xpbd';

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  invMass: number;      // 0 = static
  invInertia: number;   // 0 = no rotation
  restitution: number;  // 0..1
  friction: number;     // 0..1
  /** Continuous collision detection for fast movers (e.g. projectiles). */
  ccd: boolean;
  /** Sleeping bookkeeping — managed by IslandSleepManager. */
  sleepTimer: number;
  sleeping: boolean;
}

export function isStatic(body: Body): boolean {
  return body.invMass === 0;
}

// ---------------------------------------------------------------------------
// Contact manifold
// ---------------------------------------------------------------------------

export interface ContactPoint {
  /** Contact position in world space. */
  x: number;
  y: number;
  /** Normal pointing from B to A. */
  nx: number;
  ny: number;
  /** Penetration depth (positive = overlapping). */
  depth: number;
  /** Accumulated impulse (warm starting). */
  impulse: number;
}

export const MAX_MANIFOLD_POINTS = 4;

export interface ContactManifold {
  bodyA: number;
  bodyB: number;
  points: ContactPoint[];
  /** Frame count since last active — for LRU eviction. */
  age: number;
}

/** Mixing rules. */
export function mixFriction(a: number, b: number): number {
  return Math.sqrt(a * b);
}

export function mixRestitution(a: number, b: number): number {
  return Math.max(a, b);
}

// ---------------------------------------------------------------------------
// Penetration clamp
// ---------------------------------------------------------------------------

/** Maximum penetration correction per step to prevent tunneling artifacts. */
export const MAX_PENETRATION_CORRECTION = 0.5;

export function clampPenetration(depth: number): number {
  return Math.min(depth, MAX_PENETRATION_CORRECTION);
}

// ---------------------------------------------------------------------------
// Sequential-impulse solver (V1-compatible, now with compliance + warm start)
// ---------------------------------------------------------------------------

export interface SolverConfig {
  mode: PhysicsMode;
  iterations: number;
  /** Baumgarte/position-correction bias factor. */
  baumgarteFactor: number;
  /** Allowed penetration slop (avoid jitter for tiny overlaps). */
  penetrationSlop: number;
}

export type DeviceClass = 'mobile-safe' | 'default' | 'accurate';

const SOLVER_PRESETS: Record<DeviceClass, SolverConfig> = {
  'mobile-safe': { mode: 'sequential-impulse', iterations: 4, baumgarteFactor: 0.1, penetrationSlop: 0.01 },
  'default':     { mode: 'sequential-impulse', iterations: 8, baumgarteFactor: 0.2, penetrationSlop: 0.005 },
  'accurate':    { mode: 'sequential-impulse', iterations: 10, baumgarteFactor: 0.3, penetrationSlop: 0.001 },
};

export function getSolverPreset(device: DeviceClass): SolverConfig {
  return { ...SOLVER_PRESETS[device] };
}

// ---------------------------------------------------------------------------
// XPBD constraint
// ---------------------------------------------------------------------------

export interface XPBDConstraint {
  bodyA: number;
  bodyB: number;
  /** Rest length (distance constraint). */
  restLength: number;
  /** Compliance α (0 = rigid, larger = softer). */
  compliance: number;
}

/**
 * Solve one XPBD distance constraint iteration.
 * Modifies body positions in-place.
 * Returns position delta magnitude for convergence check.
 */
export function solveXPBDDistance(
  bA: Body,
  bB: Body,
  constraint: XPBDConstraint,
  dt: number,
): number {
  const dx = bB.x - bA.x;
  const dy = bB.y - bA.y;
  const dist = Math.hypot(dx, dy) || 1e-9;
  const dir = { x: dx / dist, y: dy / dist };

  const C = dist - constraint.restLength; // constraint error
  const w = bA.invMass + bB.invMass;
  const alpha = constraint.compliance / (dt * dt);
  const dLambda = -C / (w + alpha);

  const correction = dLambda;
  if (bA.invMass > 0) {
    bA.x = fpSafe(bA.x - bA.invMass * correction * dir.x);
    bA.y = fpSafe(bA.y - bA.invMass * correction * dir.y);
  }
  if (bB.invMass > 0) {
    bB.x = fpSafe(bB.x + bB.invMass * correction * dir.x);
    bB.y = fpSafe(bB.y + bB.invMass * correction * dir.y);
  }

  return Math.abs(correction);
}

// ---------------------------------------------------------------------------
// Island-based sleeping
// ---------------------------------------------------------------------------

export interface SleepConfig {
  /** Linear velocity threshold below which a body is considered sleepy. */
  linearThreshold: number;
  /** Angular velocity threshold. */
  angularThreshold: number;
  /** How many seconds a body must remain below threshold before sleeping. */
  timeToSleep: number;
}

export const DEFAULT_SLEEP_CONFIG: SleepConfig = {
  linearThreshold: 0.01,
  angularThreshold: 0.01,
  timeToSleep: 0.5,
};

export class IslandSleepManager {
  private readonly config: SleepConfig;

  constructor(config: SleepConfig = DEFAULT_SLEEP_CONFIG) {
    this.config = config;
  }

  /**
   * Update sleep timer for each body.
   * If all bodies in an island are sleepy, put the whole island to sleep.
   */
  updateIslands(islands: Body[][], dt: number): void {
    for (const island of islands) {
      let allSleepy = true;

      for (const body of island) {
        if (isStatic(body)) continue;

        const linSpd = Math.hypot(body.vx, body.vy);
        const angSpd = Math.abs(body.angularVel);
        const sleepy = linSpd < this.config.linearThreshold &&
                       angSpd < this.config.angularThreshold;

        if (sleepy) {
          body.sleepTimer += dt;
        } else {
          body.sleepTimer = 0;
          allSleepy = false;
        }
      }

      const islandSleeps = allSleepy && island.every(
        b => isStatic(b) || b.sleepTimer >= this.config.timeToSleep
      );

      for (const body of island) {
        if (!isStatic(body)) {
          body.sleeping = islandSleeps;
        }
      }
    }
  }

  /** Wake up all bodies in the island (e.g. on external force application). */
  wakeIsland(island: Body[]): void {
    for (const body of island) {
      body.sleeping = false;
      body.sleepTimer = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Swept CCD helper (simple linear sweep for fast movers)
// ---------------------------------------------------------------------------

/**
 * Conservative advancement: find the earliest time of impact in [0,1].
 * Returns 1 if no impact detected within the step.
 * This is a coarse-grained check (AABB sweep only).
 */
export function sweptAABBTimeOfImpact(
  axMin: number, axMax: number, ayMin: number, ayMax: number,
  bxMin: number, bxMax: number, byMin: number, byMax: number,
  vAx: number, vAy: number,
): number {
  // Relative velocity of A w.r.t. B
  const relVx = vAx;
  const relVy = vAy;

  let tFirst = 0;
  let tLast = 1;

  // X axis
  if (relVx === 0) {
    if (axMax < bxMin || axMin > bxMax) return 1; // separated, no impact
  } else {
    const t1 = (bxMin - axMax) / relVx;
    const t2 = (bxMax - axMin) / relVx;
    tFirst = Math.max(tFirst, Math.min(t1, t2));
    tLast = Math.min(tLast, Math.max(t1, t2));
    if (tFirst > tLast) return 1;
  }

  // Y axis
  if (relVy === 0) {
    if (ayMax < byMin || ayMin > byMax) return 1;
  } else {
    const t1 = (byMin - ayMax) / relVy;
    const t2 = (byMax - ayMin) / relVy;
    tFirst = Math.max(tFirst, Math.min(t1, t2));
    tLast = Math.min(tLast, Math.max(t1, t2));
    if (tFirst > tLast) return 1;
  }

  return tFirst;
}
