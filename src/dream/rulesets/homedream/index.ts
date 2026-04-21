// src/dream/rulesets/homedream/index.ts — barrel for HomeDream ruleset
// Exports constants, transforms, physics params. No engin imports.

export {
  HOMEDREAM_GRAVITY,
  HOMEDREAM_MAX_ENTITIES,
  HOMEDREAM_FRAME_BUDGET_MS,
  HOMEDREAM_WORLD_ID,
} from './dream.homedream.constants';

export type { EntityState, HomeDreamState } from './dream.homedream.transforms';
export { applyDelta, createInitialState } from './dream.homedream.transforms';

export type { PhysicsConstraint } from './dream.homedream.physics';
export {
  HOMEDREAM_PHYSICS_CONSTRAINTS,
  resolveConstraint,
} from './dream.homedream.physics';
