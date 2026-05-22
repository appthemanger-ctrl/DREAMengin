/**
 * lib/vm/index.ts — WASM+GPU VM Public API
 *
 * Barrel export for the WASM+GPU Virtual Machine implementation.
 */

// ── §35 Feature detection ─────────────────────────────────────────────────────
export {
    detectWasmFeatures,
    resetWasmFeatureCache,
    type WasmFeatureSet
} from './wasm-features';

// ── §35 Resource quotas ───────────────────────────────────────────────────────
export {
    DEFAULT_RESOURCE_QUOTA, QuotaExceededError, enforceQuota,
    withinQuota, type QuotaViolation, type ResourceQuota,
    type ResourceUsage
} from './resource-quota';

// ── §35 Inter-VM messaging ────────────────────────────────────────────────────
export { InterVMChannel, type VMEvent } from './inter-vm-messaging';

// ── §35 Security ──────────────────────────────────────────────────────────────
export {
    GPUTimeSlicer, MemoryBoundsError,
    SYSCALL_ALLOWLIST, checkBounds,
    isSyscallAllowed, type AllowedSyscall,
    type TimeBudget
} from './security';

// ── §35.5 Bus events ──────────────────────────────────────────────────────────
export type {
    VMBusEventMap,
    VMBusEventName, VMComputeCompletePayload,
    VMErrorPayload, VMStatsPayload, VMStatsUpdatePayload, VMWorkloadSubmittedPayload
} from './bus-events';

// ── §35 DualRuntime orchestrator ──────────────────────────────────────────────
export {
    DualRuntime,
    dualRuntime,
    type VMId, type VMRuntimeStats, type VMWorkloadSpec
} from './dual-runtime';

export { BufferManager } from './bufferManager';
export {
    destroyDualVMCoordinator, getDualVMCoordinator,
    initializeDualVMCoordinator, type DualVMConfig, type DualVMCoordinator,
    type VMRegion, type VMWorkload
} from './dualVMCoordinator';
export { PipelineCache } from './pipelineCache';
export { SnapshotManager } from './snapshot';
export { WasmGpuVM } from './wasmGpuVM';

export type {
    BindGroupDescriptor, BindGroupHandle, BufferHandle, CommandBufferState, ComputePipelineDescriptor, GPUBufferDescriptor, GPUBufferSnapshot, HandleTableSnapshot, LayoutHandle, PipelineHandle, PipelineSnapshot, VMConfig, VMErrorCode, VMEventChannel, VMMessageQueueDescriptor, VMPerformanceCounters, VMResourceQuotas, VMSnapshot, VMState, VMSyscalls, WasmLinearMemory, WasmMemorySnapshot
} from './types';

export { DEFAULT_VM_CONFIG, VMErrorCode as ErrorCode, GPUBufferUsageFlags } from './types';
