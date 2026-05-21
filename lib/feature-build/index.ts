/**
 * lib/feature-build/index.ts
 *
 * Barrel export for the feature-build module.
 *
 * Usage:
 *   import { FEATURE_MANIFESTS, computeBuildCycleState, SICC_DIMENSIONS } from '@/lib/feature-build';
 */

export { FEATURE_MANIFESTS, getManifest } from './featureManifest';
export type { DaydreamEnginManifest, FeatureEntry, FeatureStatus } from './featureManifest';

export {
    allPairsInRefinePhase,
    allPairsMovingForward, calculateProgress, computeAllBuildCycleStates, computeBuildCycleState, countFeaturesByStatus,
    countUsableFeatures, getBuildPhase
} from './buildCycle';
export type { BuildCycleState, BuildPhase } from './buildCycle';

export {
    SICC_DIMENSIONS, SICC_GLOBAL_CRITERIA, getCriteriaForDimension
} from './uiQualityCriteria';
export type { SICCDimension, UIQualityCheck } from './uiQualityCriteria';
