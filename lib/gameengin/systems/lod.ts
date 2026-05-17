/**
 * lib/gameengin/systems/lod.ts
 *
 * LOD SYSTEM
 *
 * Focused module: distance-based level-of-detail manager with hysteresis.
 * Prevents LOD flickering at transition boundaries; compatible with any
 * 3-D or projected-2-D coordinate system.
 *
 * Re-exports from power-systems so existing imports continue to work.
 */

// --- Classes -----------------------------------------------------------------

export { LODSystem } from '../power-systems';

// --- Types -------------------------------------------------------------------

export type { LODLevel, LODObject } from '../power-systems';
