// src/dreamsurface/index.ts — barrel for dreamsurface namespace
// The stable bridge between dream.* and engin.core.*.

export { createBridge } from './dreamsurface.bridge';
export type { DreamSurfaceBridge } from './dreamsurface.bridge';

export { computeDelta, mergeDelta } from './dreamsurface.delta';
export type { StateDelta } from './dreamsurface.delta';
