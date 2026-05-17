/**
 * lib/vm/index.ts — WASM+GPU VM Public API
 *
 * Barrel export for the WASM+GPU Virtual Machine implementation.
 */

// -- §35 Feature detection -----------------------------------------------------
export {
  detectWasmFeatures,
  resetWasmFeatureCache,
  type WasmFeatureSet,
} from './wasm-features';

// -- §35 Resource quotas -------------------------------------------------------
export {
  enforceQuota,
  withinQuota,
  QuotaExceededError,
  DEFAULT_RESOURCE_QUOTA,
  type ResourceQuota,
  type ResourceUsage,
  type QuotaViolation,
} from './resource-quota';

// -- §35 Inter-VM messaging ----------------------------------------------------
export { InterVMChannel, type VMEvent } from './inter-vm-messaging';

// -- §35 Security --------------------------------------------------------------
export {
  checkBounds,
  isSyscallAllowed,
  MemoryBoundsError,
  SYSCALL_ALLOWLIST,
  GPUTimeSlicer,
  type AllowedSyscall,
  type TimeBudget,
} from './security';

// -- §35.5 Bus events ----------------------------------------------------------
export type {
  VMBusEventMap,
  VMBusEventName,
  VMWorkloadSubmittedPayload,
  VMComputeCompletePayload,
  VMErrorPayload,
  VMStatsUpdatePayload,
  VMStatsPayload,
} from './bus-events';

// -- §35 DualRuntime orchestrator ----------------------------------------------
export {
  DualRuntime,
  dualRuntime,
  type VMId,
  type VMWorkloadSpec,
  type VMRuntimeStats,
} from './dual-runtime';

export { WasmGpuVM } from './wasmGpuVM';
export { BufferManager } from './bufferManager';
export { PipelineCache } from './pipelineCache';
export { SnapshotManager } from './snapshot';
export {
  getDualVMCoordinator,
  initializeDualVMCoordinator,
  destroyDualVMCoordinator,
  type DualVMCoordinator,
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
