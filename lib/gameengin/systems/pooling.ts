/**
 * lib/gameengin/systems/pooling.ts
 *
 * POOLING SYSTEMS
 *
 * Focused module: zero-allocation fixed-capacity object pool (ResourcePool);
 * higher-level named-pool registry (ObjectPoolingSystem).
 *
 * Re-exports ResourcePool from power-systems; ObjectPoolingSystem is new here.
 */

import { ResourcePool } from '../power-systems';

export { ResourcePool } from '../power-systems';

// ─────────────────────────────────────────────────────────────────────────────
//  ObjectPoolingSystem — named registry of ResourcePool instances
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Higher-level manager for multiple named ResourcePool instances.
 * Provides a single point of control for creating, accessing, and flushing
 * pools across systems (bullets, particles, hit-effects, AI nodes, etc.).
 *
 * @example
 * const pooling = new ObjectPoolingSystem();
 * const bullets = pooling.createPool('bullets', () => new Bullet(), 256);
 * const b = bullets.acquire();
 */
export class ObjectPoolingSystem {
  // Use a mapped record keyed by name, value typed as generic pool.
   
  private pools = new Map<string, ResourcePool<unknown>>();

  /**
   * Create and register a new pool.
   * @param name     - unique pool identifier
   * @param factory  - zero-arg constructor for pool items
   * @param capacity - pre-allocated pool size
   */
  createPool<T extends { reset?(): void }>(
    name: string,
    factory: () => T,
    capacity: number,
  ): ResourcePool<T> {
    const pool = new ResourcePool<T>(factory, capacity);
    this.pools.set(name, pool);
    return pool;
  }

  /** Retrieve a previously created pool by name. Returns undefined if not found. */
  getPool<T extends { reset?(): void }>(name: string): ResourcePool<T> | undefined {
    return this.pools.get(name) as ResourcePool<T> | undefined;
  }

  /** Release all active objects in a named pool back to the pool. */
  releaseAll(name: string): void {
    this.pools.get(name)?.releaseAll();
  }

  /** Release all active objects in every registered pool. */
  releaseAllPools(): void {
    for (const pool of this.pools.values()) pool.releaseAll();
  }

  /** Aggregate stats for all registered pools. */
  get stats(): Record<string, ReturnType<ResourcePool<object>['stats']['valueOf']>> {
    const out: Record<string, unknown> = {};
    for (const [name, pool] of this.pools) out[name] = pool.stats;
     
    return out as unknown;
  }
}
