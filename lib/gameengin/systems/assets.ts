/**
 * lib/gameengin/systems/assets.ts
 *
 * ASSET STREAMING SYSTEM
 *
 * Focused module: priority-queue progressive LOD asset streaming manager.
 * Sorts pending fetches by priority + LOD level; enforces max-concurrent
 * budget; supports cancellation + LRU eviction.
 *
 * Re-exports from power-systems so existing imports continue to work.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export { AssetStreamManager } from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  AssetHandle,
  AssetType,
  AssetState,
} from '../power-systems';
