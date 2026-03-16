/**
 * lib/feature-build/index.ts
 *
 * Barrel export for the feature-build module.
 *
 * Usage:
 *   import { FEATURE_MANIFESTS, computeBuildCycleState, SICC_DIMENSIONS } from '@/lib/feature-build';
 */

export type { FeatureStatus, FeatureEntry, DaydreamEnginManifest } from './featureManifest';
export { FEATURE_MANIFESTS, getManifest } from './featureManifest';

export type { BuildPhase, BuildCycleState } from './buildCycle';
export {
  getBuildPhase,
  calculateProgress,
  countFeaturesByStatus,
  computeBuildCycleState,
  computeAllBuildCycleStates,
  allPairsInRefinePhase,
} from './buildCycle';

export type { SICCDimension, UIQualityCheck } from './uiQualityCriteria';
export {
  SICC_GLOBAL_CRITERIA,
  SICC_DIMENSIONS,
  getCriteriaForDimension,
} from './uiQualityCriteria';
