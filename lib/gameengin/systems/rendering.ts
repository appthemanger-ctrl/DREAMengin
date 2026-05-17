/**
 * lib/gameengin/systems/rendering.ts
 *
 * RENDERING SYSTEMS
 *
 * Focused module: WebGPU compute shader pipeline (physics / particles / cloth
 * simulation on GPU); WGSL hot-reload shader cache + variant compilation;
 * CPU+GPU profiler with flame-graph ring buffer.
 *
 * Re-exports from power-systems so existing imports continue to work.
 * `GPUComputeSystem` is an alias for `ComputeShaderPipeline`.
 */

// --- Classes -----------------------------------------------------------------

export {
  ComputeShaderPipeline,
  WGSLShaderManager,
  GPUProfiler,
} from '../power-systems';

/** Alias: GPUComputeSystem → ComputeShaderPipeline. */
export { ComputeShaderPipeline as GPUComputeSystem } from '../power-systems';

// --- Types -------------------------------------------------------------------

export type {
  ComputeKernel,
  ComputeDispatch,
  ShaderVariant,
  ProfileSpan,
  ProfileFrame,
} from '../power-systems';
