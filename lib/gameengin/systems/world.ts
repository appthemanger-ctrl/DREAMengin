/**
 * lib/gameengin/systems/world.ts
 *
 * WORLD GENERATION SYSTEMS
 *
 * Focused module: seeded Simplex-noise procedural world generator; heightmap
 * clipmap LOD terrain engine; spherical-harmonics GI light probes (L2 = 9
 * coefficients × RGB).
 *
 * Re-exports from power-systems so existing imports continue to work.
 * `TerrainSystem` and `GIProbeSystem` are canonical aliases.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export {
    GlobalIllumProbes, ProceduralWorldGen,
    TerrainEngine
} from '../power-systems';

/** Alias: TerrainSystem → TerrainEngine. */
export { TerrainEngine as TerrainSystem } from '../power-systems';

/** Alias: GIProbeSystem → GlobalIllumProbes. */
export { GlobalIllumProbes as GIProbeSystem } from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
    GIProbe, SHCoeffs, TerrainPage, WorldChunk, WorldGenConfig
} from '../power-systems';
