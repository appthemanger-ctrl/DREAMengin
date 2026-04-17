/**
 * engins/gameengin/systems/spatial.ts
 *
 * SPATIAL SYSTEMS
 *
 * Focused module: Octree/BVH spatial partitioning for O(log n) broad-phase
 * queries; HRTF spatial audio DSP with convolution reverb + Doppler.
 *
 * Re-exports from power-systems so existing imports continue to work.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export {
  OctreeBVH,
  SpatialAudioDSP,
} from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  AABB,
  SpatialEntry,
  AudioSourceDef,
  ListenerState,
} from '../power-systems';
