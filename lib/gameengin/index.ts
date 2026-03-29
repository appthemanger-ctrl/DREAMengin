/**
 * lib/gameengin/index.ts
 *
 * DREAMengin Elite Game Engine — Public API
 *
 * Single import surface for all elite engine capabilities:
 *   import { EliteGameEngine, AIDirector, PostFXManager } from '@/lib/gameengin';
 */

export { EliteGameEngine, ECSWorld } from './core';
export type {
  EntityId,
  Component,
  System,
  QualityTier,
  PerformanceBudget,
  FrameTelemetry,
  FrameCallback,
  QualityChangeCallback,
} from './core';

export { AIDirector } from './ai-director';
export type { PlayerSignals, DirectorState } from './ai-director';

export { PostFXManager } from './post-fx';
