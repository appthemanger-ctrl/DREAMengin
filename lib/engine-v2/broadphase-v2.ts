// lib/engine-v2/broadphase-v2.ts
// Phase 4 — Broadphase upgrade: dynamic cell sizing, pair cache with LRU eviction,
// residual scoring, AABB fattening, collision layer matrix, spatial queries.
// Pure module — no React, no DOM dependencies.

import { normalisePair, sortPairs, type BodyPair } from './determinism';

// ---------------------------------------------------------------------------
// AABB
// ---------------------------------------------------------------------------

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Expand an AABB by a fattening factor (speculative contacts). */
export function fattenAABB(aabb: AABB, factor: number): AABB {
  const dx = (aabb.maxX - aabb.minX) * factor * 0.5;
  const dy = (aabb.maxY - aabb.minY) * factor * 0.5;
  return {
    minX: aabb.minX - dx,
    minY: aabb.minY - dy,
    maxX: aabb.maxX + dx,
    maxY: aabb.maxY + dy,
  };
}

export function aabbOverlaps(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX &&
         a.minY <= b.maxY && a.maxY >= b.minY;
}

// ---------------------------------------------------------------------------
// Collision layer matrix
// ---------------------------------------------------------------------------

/**
 * Layer mask: each body belongs to a layer (1 bit in a 32-bit int).
 * Two bodies collide only if `(maskA & layerB) !== 0 && (maskB & layerA) !== 0`.
 */
export interface CollisionFilter {
  /** Layer this body belongs to (single bit, e.g. 1 << layerIndex). */
  layer: number;
  /** Bitmask of layers this body collides with. */
  mask: number;
}

export function filtersCollide(a: CollisionFilter, b: CollisionFilter): boolean {
  return (a.mask & b.layer) !== 0 && (b.mask & a.layer) !== 0;
}

/** Pre-built common layer presets. */
export const CollisionLayers = {
  DEFAULT: 1 << 0,
  PLAYER:  1 << 1,
  ENEMY:   1 << 2,
  TRIGGER: 1 << 3,
  WALL:    1 << 4,
  PROJECTILE: 1 << 5,
} as const;

// ---------------------------------------------------------------------------
// Pair cache with LRU eviction
// ---------------------------------------------------------------------------

export interface CachedPair extends BodyPair {
  /** Frame number of last active detection. */
  lastSeen: number;
  /** Heuristic score for residual prioritisation (higher = check first). */
  residualScore: number;
}

export class PairCache {
  private readonly cache = new Map<string, CachedPair>();
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  private key(a: number, b: number): string {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    return `${lo}:${hi}`;
  }

  touch(a: number, b: number, frame: number): void {
    const k = this.key(a, b);
    const existing = this.cache.get(k);
    if (existing) {
      existing.lastSeen = frame;
      existing.residualScore = Math.min(existing.residualScore + 1, 100);
    } else {
      if (this.cache.size >= this.capacity) {
        this.evictOldest();
      }
      const pair = normalisePair(a, b);
      this.cache.set(k, { ...pair, lastSeen: frame, residualScore: 1 });
    }
  }

  has(a: number, b: number): boolean {
    return this.cache.has(this.key(a, b));
  }

  get(a: number, b: number): CachedPair | undefined {
    return this.cache.get(this.key(a, b));
  }

  /** Evict pairs not seen in the last `maxAge` frames. */
  evictStale(currentFrame: number, maxAge: number): void {
    for (const [k, pair] of this.cache) {
      if (currentFrame - pair.lastSeen > maxAge) {
        this.cache.delete(k);
      }
    }
  }

  /** Return cached pairs sorted by residual score (highest first). */
  residualPriority(): CachedPair[] {
    return [...this.cache.values()].sort((a, b) => b.residualScore - a.residualScore);
  }

  private evictOldest(): void {
    let oldest = Infinity;
    let oldestKey = '';
    for (const [k, pair] of this.cache) {
      if (pair.lastSeen < oldest) {
        oldest = pair.lastSeen;
        oldestKey = k;
      }
    }
    if (oldestKey) this.cache.delete(oldestKey);
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ---------------------------------------------------------------------------
// Uniform grid broadphase with dynamic cell sizing
// ---------------------------------------------------------------------------

export interface BroadphaseBody {
  id: number;
  aabb: AABB;
  filter: CollisionFilter;
  sleeping: boolean;
}

export interface BroadphaseConfig {
  /** AABB fattening factor for speculative contacts. */
  fattenFactor: number;
  /** Maximum pairs to emit per frame (query budget). */
  maxPairs: number;
}

export const DEFAULT_BROADPHASE_CONFIG: BroadphaseConfig = {
  fattenFactor: 0.05,
  maxPairs: 500,
};

/**
 * Compute the optimal cell size for a uniform grid based on the median
 * collider size in the scene. Prevents over-/under-sized cells.
 */
export function computeOptimalCellSize(bodies: BroadphaseBody[]): number {
  if (bodies.length === 0) return 64;

  const sizes = bodies.map(b => {
    const w = b.aabb.maxX - b.aabb.minX;
    const h = b.aabb.maxY - b.aabb.minY;
    return Math.max(w, h);
  }).sort((a, b) => a - b);

  const median = sizes[Math.floor(sizes.length / 2)];
  // Cell size = 2× median so each body fits in at most a 2×2 cell range.
  return Math.max(1, median * 2);
}

export class UniformGridBroadphase {
  private readonly config: BroadphaseConfig;
  private cellSize = 64;
  private readonly cells = new Map<string, number[]>();

  constructor(config: BroadphaseConfig = DEFAULT_BROADPHASE_CONFIG) {
    this.config = config;
  }

  setCellSize(size: number): void {
    this.cellSize = Math.max(1, size);
  }

  private cellKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private cellCoord(v: number): number {
    return Math.floor(v / this.cellSize);
  }

  /** Insert body AABBs into the grid (call once per frame after clearing). */
  build(bodies: BroadphaseBody[]): void {
    this.cells.clear();

    for (const body of bodies) {
      if (body.sleeping) continue;

      const fat = fattenAABB(body.aabb, this.config.fattenFactor);
      const x0 = this.cellCoord(fat.minX);
      const x1 = this.cellCoord(fat.maxX);
      const y0 = this.cellCoord(fat.minY);
      const y1 = this.cellCoord(fat.maxY);

      for (let cx = x0; cx <= x1; cx++) {
        for (let cy = y0; cy <= y1; cy++) {
          const k = this.cellKey(cx, cy);
          let cell = this.cells.get(k);
          if (!cell) {
            cell = [];
            this.cells.set(k, cell);
          }
          cell.push(body.id);
        }
      }
    }
  }

  /** Generate candidate pairs, respecting layer filters and maxPairs budget. */
  queryPairs(bodies: BroadphaseBody[]): BodyPair[] {
    const bodyMap = new Map(bodies.map(b => [b.id, b]));
    const seen = new Set<string>();
    const pairs: BodyPair[] = [];

    for (const cell of this.cells.values()) {
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          const idA = cell[i];
          const idB = cell[j];
          const pair = normalisePair(idA, idB);
          const k = `${pair.a}:${pair.b}`;
          if (seen.has(k)) continue;
          seen.add(k);

          if (pairs.length >= this.config.maxPairs) break;

          const bA = bodyMap.get(idA);
          const bB = bodyMap.get(idB);
          if (!bA || !bB) continue;
          if (!filtersCollide(bA.filter, bB.filter)) continue;
          if (bA.sleeping && bB.sleeping) continue;
          if (!aabbOverlaps(bA.aabb, bB.aabb)) continue;

          pairs.push(pair);
        }
        if (pairs.length >= this.config.maxPairs) break;
      }
    }

    return sortPairs(pairs);
  }
}

// ---------------------------------------------------------------------------
// Spatial query API
// ---------------------------------------------------------------------------

export interface SpatialQueryBudget {
  maxQueriesPerFrame: number;
  queriesThisFrame: number;
}

export function newQueryBudget(max = 64): SpatialQueryBudget {
  return { maxQueriesPerFrame: max, queriesThisFrame: 0 };
}

export function canQuery(budget: SpatialQueryBudget): boolean {
  return budget.queriesThisFrame < budget.maxQueriesPerFrame;
}

export function consumeQuery(budget: SpatialQueryBudget): void {
  budget.queriesThisFrame++;
}

export function resetQueryBudget(budget: SpatialQueryBudget): void {
  budget.queriesThisFrame = 0;
}

/** Find all bodies whose AABB overlaps the given circle. */
export function overlapCircle(
  bodies: BroadphaseBody[],
  cx: number,
  cy: number,
  radius: number,
): BroadphaseBody[] {
  const rr = radius * radius;
  return bodies.filter(b => {
    const nearX = Math.max(b.aabb.minX, Math.min(cx, b.aabb.maxX));
    const nearY = Math.max(b.aabb.minY, Math.min(cy, b.aabb.maxY));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return dx * dx + dy * dy <= rr;
  });
}

/** Raycast — return bodies whose AABB intersects the segment from (ox,oy) to (ox+dx*maxT, oy+dy*maxT). */
export function raycast(
  bodies: BroadphaseBody[],
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  maxT = 1000,
): Array<{ body: BroadphaseBody; t: number }> {
  const hits: Array<{ body: BroadphaseBody; t: number }> = [];

  for (const body of bodies) {
    const { minX, minY, maxX, maxY } = body.aabb;
    // Slab method
    const invDx = dx === 0 ? Infinity : 1 / dx;
    const invDy = dy === 0 ? Infinity : 1 / dy;

    const tx1 = (minX - ox) * invDx;
    const tx2 = (maxX - ox) * invDx;
    const ty1 = (minY - oy) * invDy;
    const ty2 = (maxY - oy) * invDy;

    const tMin = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2));
    const tMax = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));

    if (tMax >= 0 && tMin <= tMax && tMin <= maxT) {
      hits.push({ body, t: Math.max(0, tMin) });
    }
  }

  return hits.sort((a, b) => a.t - b.t);
}

/** Find the nearest body to a point. */
export function nearest(
  bodies: BroadphaseBody[],
  px: number,
  py: number,
): BroadphaseBody | null {
  let best: BroadphaseBody | null = null;
  let bestDist = Infinity;

  for (const body of bodies) {
    const cx = (body.aabb.minX + body.aabb.maxX) / 2;
    const cy = (body.aabb.minY + body.aabb.maxY) / 2;
    const d = Math.hypot(px - cx, py - cy);
    if (d < bestDist) {
      bestDist = d;
      best = body;
    }
  }

  return best;
}
