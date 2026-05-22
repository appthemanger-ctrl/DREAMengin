/**
 * lib/gameengin/systems/index.ts
 *
 * Barrel export for all focused power-system sub-modules.
 * Import individual modules for tree-shaking, or import everything here.
 *
 * @example
 * import { OctreeBVH, ResourcePool } from '@/lib/gameengin/systems';
 */

export * from './ai';
export * from './animation';
export * from './assets';
export * from './lod';
export * from './network';
export * from './physics';
export * from './pooling';
export * from './rendering';
export * from './spatial';
export * from './world';
