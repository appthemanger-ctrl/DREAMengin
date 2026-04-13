/**
 * lib/vm/index.ts — WASM+GPU VM Public API
 *
 * Barrel export for the WASM+GPU Virtual Machine implementation.
 */

export { WasmGpuVM } from './wasmGpuVM';
export { BufferManager } from './bufferManager';
export { PipelineCache } from './pipelineCache';
export { SnapshotManager } from './snapshot';
export {
  DualVMCoordinator,
  initializeDualVMCoordinator,
  getDualVMCoordinator,
  destroyDualVMCoordinator,
  type VMRegion,
  type DualVMConfig,
  type VMWorkload,
} from './dualVMCoordinator';

export type {
  VMConfig,
  VMState,
  VMErrorCode,
  VMSyscalls,
  BufferHandle,
  PipelineHandle,
  BindGroupHandle,
  LayoutHandle,
  WasmLinearMemory,
  GPUBufferDescriptor,
  ComputePipelineDescriptor,
  BindGroupDescriptor,
  CommandBufferState,
  VMResourceQuotas,
  VMPerformanceCounters,
  VMSnapshot,
  WasmMemorySnapshot,
  GPUBufferSnapshot,
  PipelineSnapshot,
  HandleTableSnapshot,
  VMMessageQueueDescriptor,
  VMEventChannel,
} from './types';

export { GPUBufferUsageFlags, VMErrorCode as ErrorCode, DEFAULT_VM_CONFIG } from './types';
