/**
 * lib/feature-build/buildCycle.ts
 *
 * Build Cycle phase logic for Daydream+Engin pairs.
 *
 * Phases:
 *   BUILD  — features are being integrated toward maxFeatures.
 *   REFINE — all maxFeatures are implemented; focus is UI quality (SICC).
 *
 * The phase is computed from the count of 'implemented' features in the manifest.
 * CI workflows run code scans to verify the manifest is accurate and report progress.
 */

import type { DaydreamEnginManifest, FeatureStatus } from './featureManifest';

// ─── Phase ────────────────────────────────────────────────────────────────────

/**
 * BUILD  → active feature integration, adding capabilities per cycle.
 * REFINE → feature-complete; improving Stylized · Intuitive · Cohesive · Coherent UI.
 */
export type BuildPhase = 'BUILD' | 'REFINE';

// ─── Progress snapshot ────────────────────────────────────────────────────────

export interface BuildCycleState {
  domain: string;
  engin: string;
  phase: BuildPhase;
  featuresImplemented: number;
  featurePlanned: number;
  maxFeatures: number;
  /** 0–100 integer representing percentage of max reached */
  progressPct: number;
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Determine whether a Daydream+Engin pair is in BUILD or REFINE phase.
 * Switches to REFINE once featuresImplemented >= maxFeatures.
 */
export function getBuildPhase(featuresImplemented: number, maxFeatures: number): BuildPhase {
  return featuresImplemented >= maxFeatures ? 'REFINE' : 'BUILD';
}

/**
 * Calculate the build progress as an integer 0–100.
 * Clamped so it never exceeds 100 even if manifest data is inconsistent.
 */
export function calculateProgress(featuresImplemented: number, maxFeatures: number): number {
  if (maxFeatures <= 0) return 0;
  return Math.min(100, Math.round((featuresImplemented / maxFeatures) * 100));
}

/**
 * Count features by status within a manifest.
 */
export function countFeaturesByStatus(
  manifest: DaydreamEnginManifest,
  status: FeatureStatus,
): number {
  return manifest.features.filter((f) => f.status === status).length;
}

/**
 * Compute the full BuildCycleState for a given manifest.
 */
export function computeBuildCycleState(manifest: DaydreamEnginManifest): BuildCycleState {
  const featuresImplemented = countFeaturesByStatus(manifest, 'implemented');
  const featurePlanned      = countFeaturesByStatus(manifest, 'planned');
  const { maxFeatures, domain, engin } = manifest;

  return {
    domain,
    engin,
    phase:               getBuildPhase(featuresImplemented, maxFeatures),
    featuresImplemented,
    featurePlanned,
    maxFeatures,
    progressPct:         calculateProgress(featuresImplemented, maxFeatures),
  };
}

/**
 * Compute BuildCycleState for all manifests.
 */
export function computeAllBuildCycleStates(
  manifests: readonly DaydreamEnginManifest[],
): BuildCycleState[] {
  return manifests.map(computeBuildCycleState);
}

/**
 * Returns true if all manifests in the supplied list are in REFINE phase.
 * Used by CI to gate full-platform UI quality runs.
 */
export function allPairsInRefinePhase(states: BuildCycleState[]): boolean {
  return states.length > 0 && states.every((s) => s.phase === 'REFINE');
}
