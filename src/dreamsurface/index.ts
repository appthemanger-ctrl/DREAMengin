// src/dreamsurface/index.ts — barrel for dreamsurface namespace
// The stable bridge between dream.* and engin.core.*.

export type { DreamSurfaceBridge } from './dreamsurface.bridge';
export { createBridge } from './dreamsurface.bridge';

export type { StateDelta } from './dreamsurface.delta';
export { computeDelta, mergeDelta } from './dreamsurface.delta';
