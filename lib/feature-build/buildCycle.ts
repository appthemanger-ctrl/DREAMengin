/**
 * lib/feature-build/buildCycle.ts
 *
 * Build Cycle phase logic for Daydream+Engin pairs.
 *
 * Phases:
 *   BUILD   — usable feature fraction is below refineThreshold; core work underway.
 *   UPGRADE — usable fraction meets threshold but not all features implemented;
 *             concurrent build + SICC refinement. "UPGRADE! REFINE! we continue forward."
 *   REFINE  — all maxFeatures fully implemented; pure SICC polish.
 *
 * The phase is computed from the counts of 'implemented' and 'active' features
 * relative to maxFeatures and the manifest's refineThreshold.
 * CI workflows run code scans to verify the manifest is accurate and report progress.
 */

import type { DaydreamEnginManifest, FeatureStatus } from './featureManifest';

// ─── Phase ────────────────────────────────────────────────────────────────────

/**
 * BUILD   → core feature integration; usable fraction below refineThreshold.
 * UPGRADE → enough is live for users to act on; concurrent build + SICC refinement.
 * REFINE  → feature-complete; improving Stylized · Intuitive · Cohesive · Coherent UI.
 */
export type BuildPhase = 'BUILD' | 'UPGRADE' | 'REFINE';

// ─── Progress snapshot ────────────────────────────────────────────────────────

export interface BuildCycleState {
  domain: string;
  engin: string;
  phase: BuildPhase;
  featuresImplemented: number;
  /** Count of features with status 'active' — user-facing but not yet perfect. */
  featuresActive: number;
  featurePlanned: number;
  maxFeatures: number;
  /** 0–100 integer: implemented / maxFeatures × 100 */
  progressPct: number;
  /** 0–100 integer: (implemented + active) / maxFeatures × 100.
   *  Answers "what can the user do with what we have?" */
  usablePct: number;
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Determine the phase for a Daydream+Engin pair.
 *
 * @param featuresUsable      Count of implemented + active features.
 * @param featuresImplemented Count of fully-implemented features.
 * @param maxFeatures         Total feature count from the manifest.
 * @param refineThreshold     Fraction (0–1) of maxFeatures required for UPGRADE.
 */
export function getBuildPhase(
  featuresUsable: number,
  featuresImplemented: number,
  maxFeatures: number,
  refineThreshold: number,
): BuildPhase {
  if (featuresImplemented >= maxFeatures) return 'REFINE';
  if (maxFeatures > 0 && featuresUsable / maxFeatures >= refineThreshold) return 'UPGRADE';
  return 'BUILD';
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
 * Count features that are user-available right now (implemented + active).
 * This is the forward-motion count — what the user can do with what we have.
 */
export function countUsableFeatures(manifest: DaydreamEnginManifest): number {
  return manifest.features.filter(
    (f) => f.status === 'implemented' || f.status === 'active',
  ).length;
}

/**
 * Compute the full BuildCycleState for a given manifest.
 */
export function computeBuildCycleState(manifest: DaydreamEnginManifest): BuildCycleState {
  const featuresImplemented = countFeaturesByStatus(manifest, 'implemented');
  const featuresActive      = countFeaturesByStatus(manifest, 'active');
  const featurePlanned      = countFeaturesByStatus(manifest, 'planned');
  const featuresUsable      = featuresImplemented + featuresActive;
  const { maxFeatures, domain, engin, refineThreshold } = manifest;

  return {
    domain,
    engin,
    phase:               getBuildPhase(featuresUsable, featuresImplemented, maxFeatures, refineThreshold),
    featuresImplemented,
    featuresActive,
    featurePlanned,
    maxFeatures,
    progressPct:         calculateProgress(featuresImplemented, maxFeatures),
    usablePct:           calculateProgress(featuresUsable, maxFeatures),
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

/**
 * Returns true if all manifests have reached UPGRADE or REFINE phase.
 * Used by CI to confirm that the forward-motion threshold has been crossed for all pairs.
 * "SUCCESS CALLS FOR A SIMPLIFICATION TOWARD MOVING FORWARD."
 */
export function allPairsMovingForward(states: BuildCycleState[]): boolean {
  return states.length > 0 && states.every(
    (s) => s.phase === 'UPGRADE' || s.phase === 'REFINE',
  );
}
