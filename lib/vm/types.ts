/**
 * lib/vm/types.ts — WASM+GPU VM Type Definitions
 *
 * Core types for the dual WASM+GPU virtual machine implementation.
 * See docs/wasm_gpu_vm_spec.md for the complete specification.
 */

// ─── Handle Types ─────────────────────────────────────────────────────────────

/** Opaque handle to a GPU buffer (0 = null, ≥1 = valid). */
export type BufferHandle = number;

/** Opaque handle to a compute pipeline (0 = null, ≥1 = valid). */
export type PipelineHandle = number;

/** Opaque handle to a bind group (0 = null, ≥1 = valid). */
export type BindGroupHandle = number;

/** Opaque handle to a bind group layout (0 = null, ≥1 = valid). */
export type LayoutHandle = number;

// ─── GPU Buffer Usage Flags (LL) ──────────────────────────────────────────────

export const enum GPUBufferUsageFlags {
  STORAGE = 1 << 0,
  UNIFORM = 1 << 1,
  COPY_SRC = 1 << 2,
  COPY_DST = 1 << 3,
  MAP_READ = 1 << 4,
  MAP_WRITE = 1 << 5,
  INDIRECT = 1 << 6,
  VERTEX = 1 << 7,
  INDEX = 1 << 8,
}

// ─── Error Codes (LL) ─────────────────────────────────────────────────────────

export const enum VMErrorCode {
  SUCCESS = 0,
  OUT_OF_MEMORY = 1,
  INVALID_HANDLE = 2,
  INVALID_ARGUMENT = 3,
  GPU_ERROR = 4,
  RESOURCE_LIMIT_EXCEEDED = 5,
}

// ─── Memory Model Types (ML) ──────────────────────────────────────────────────

export interface WasmLinearMemory {
  /** Memory ID (0..N-1 for multi-memory VMs). */
  id: number;
  /** WebAssembly.Memory instance. */
  memory: WebAssembly.Memory;
  /** Whether this memory is shared (backed by SharedArrayBuffer). */
  shared: boolean;
  /** Current size in pages. */
  pages: number;
  /** Maximum size in pages (0 = no limit). */
  maxPages: number;
}

export interface GPUBufferDescriptor {
  handle: BufferHandle;
  size: bigint;
  usage: number; // GPUBufferUsageFlags bitmask
  buffer: GPUBuffer;
  mappedRange: ArrayBuffer | null;
}

// ─── Pipeline Types (ML) ──────────────────────────────────────────────────────

export interface ComputePipelineDescriptor {
  handle: PipelineHandle;
  wgslSource: string;
  sourceHash: string; // SHA-256 hex digest
  pipeline: GPUComputePipeline;
  layout: GPUPipelineLayout | 'auto';
  createdAt: number;
}

export interface BindGroupDescriptor {
  handle: BindGroupHandle;
  bindGroup: GPUBindGroup;
  layout: GPUBindGroupLayout;
  bindings: readonly GPUBindGroupEntry[];
}

// ─── Command Buffer State (ML) ────────────────────────────────────────────────

export interface CommandBufferState {
  encoder: GPUCommandEncoder | null;
  computePass: GPUComputePassEncoder | null;
  activeCommands: number;
  activePipeline: PipelineHandle;
  activeBindGroups: Map<number, BindGroupHandle>;
}

// ─── Resource Quotas (ML) ─────────────────────────────────────────────────────

export interface VMResourceQuotas {
  maxWasmMemoryPages: number;
  maxGPUBufferCount: number;
  maxGPUBufferSize: bigint;
  maxTotalGPUMemory: bigint;
  maxPipelineCount: number;
  maxBindGroupCount: number;
  maxDispatchSize: number;
  maxComputeTimeMs: number;
  maxCommandBufferLength: number;
}

export const DEFAULT_VM_QUOTAS: VMResourceQuotas = {
  maxWasmMemoryPages: 1024, // 64 MiB
  maxGPUBufferCount: 2048,
  maxGPUBufferSize: 256n * 1024n * 1024n, // 256 MiB
  maxTotalGPUMemory: 1024n * 1024n * 1024n, // 1 GiB
  maxPipelineCount: 256,
  maxBindGroupCount: 4096,
  maxDispatchSize: 65535,
  maxComputeTimeMs: 100,
  maxCommandBufferLength: 65535,
};

// ─── VM Snapshot Types (ML) ───────────────────────────────────────────────────

export interface VMSnapshot {
  version: number;
  timestamp: number;
  wasmMemories: readonly WasmMemorySnapshot[];
  gpuBuffers: readonly GPUBufferSnapshot[];
  pipelines: readonly PipelineSnapshot[];
  handleState: HandleTableSnapshot;
  quotas: VMResourceQuotas;
}

export interface WasmMemorySnapshot {
  id: number;
  size: bigint;
  data: Uint8Array;
  shared: boolean;
}

export interface GPUBufferSnapshot {
  handle: BufferHandle;
  size: bigint;
  usage: number;
  data: Uint8Array;
}

export interface PipelineSnapshot {
  sourceHash: Uint8Array; // 32 bytes SHA-256
  wgslSource: string;
  pipelineBlob: Uint8Array | null; // Cached binary if available
}

export interface HandleTableSnapshot {
  nextFreeBuffer: BufferHandle;
  nextFreePipeline: PipelineHandle;
  nextFreeBindGroup: BindGroupHandle;
  allocatedBuffers: readonly BufferHandle[];
  allocatedPipelines: readonly PipelineHandle[];
  allocatedBindGroups: readonly BindGroupHandle[];
}

// ─── Performance Counter Types (LL/ML) ────────────────────────────────────────

export interface VMPerformanceCounters {
  /** Total number of dispatches submitted. */
  totalDispatches: bigint;
  /** Total number of buffer writes (host→GPU). */
  totalBufferWrites: bigint;
  /** Total number of buffer reads (GPU→host). */
  totalBufferReads: bigint;
  /** Total bytes written to GPU buffers. */
  totalBytesWritten: bigint;
  /** Total bytes read from GPU buffers. */
  totalBytesRead: bigint;
  /** Total GPU time in nanoseconds (from timestamp queries). */
  totalGPUTimeNs: bigint;
  /** Total WASM instruction count (if available). */
  totalWasmInstructions: bigint;
  /** Number of pipeline cache hits. */
  pipelineCacheHits: number;
  /** Number of pipeline cache misses. */
  pipelineCacheMisses: number;
}

// ─── System Call ABI Types (ML) ───────────────────────────────────────────────

export interface VMSyscalls {
  // Buffer operations
  vm_buffer_create: (usage: number, size: bigint) => number;
  vm_buffer_destroy: (handle: BufferHandle) => number;
  vm_buffer_write: (
    handle: BufferHandle,
    wasmPtr: number,
    offset: bigint,
    size: bigint
  ) => number;
  vm_buffer_read: (
    handle: BufferHandle,
    wasmPtr: number,
    offset: bigint,
    size: bigint
  ) => number;
  vm_buffer_map: (
    handle: BufferHandle,
    wasmPtr: number,
    offset: bigint,
    size: bigint,
    writable: number
  ) => number;
  vm_buffer_unmap: (handle: BufferHandle) => number;

  // Pipeline operations
  vm_compute_pipeline_create: (wgslPtr: number, wgslLen: number) => number;
  vm_compute_pipeline_destroy: (handle: PipelineHandle) => number;

  // Bind group operations
  vm_bind_group_create: (
    layoutHandle: LayoutHandle,
    bindingsPtr: number,
    bindingsCount: number
  ) => number;
  vm_bind_group_destroy: (handle: BindGroupHandle) => number;

  // Command buffer operations
  vm_command_begin: () => number;
  vm_command_set_pipeline: (pipelineHandle: PipelineHandle) => number;
  vm_command_set_bind_group: (
    groupIndex: number,
    bindGroupHandle: BindGroupHandle,
    dynamicOffsetsPtr: number,
    offsetCount: number
  ) => number;
  vm_command_dispatch: (x: number, y: number, z: number) => number;
  vm_command_dispatch_indirect: (bufferHandle: BufferHandle, offset: bigint) => number;
  vm_submit: () => number;
  vm_wait_fence: () => number;

  // Utility syscalls
  vm_get_time: () => bigint;
  vm_yield: () => number;
  vm_get_instruction_count: () => bigint;
}

// ─── VM Configuration (ML) ────────────────────────────────────────────────────

export interface VMConfig {
  /** Unique VM identifier. */
  id: string;
  /** Resource quotas for this VM. */
  quotas: VMResourceQuotas;
  /** Whether to enable SharedArrayBuffer for WASM linear memory. */
  enableSharedMemory: boolean;
  /** Whether to enable timestamp queries for performance profiling. */
  enableTimestamps: boolean;
  /** Whether to enable pipeline caching (IndexedDB). */
  enablePipelineCache: boolean;
  /** Syscall allow-list (null = all allowed). */
  allowedSyscalls: readonly (keyof VMSyscalls)[] | null;
  /** Initial WASM memory pages. */
  initialMemoryPages: number;
  /** Maximum WASM memory pages. */
  maxMemoryPages: number;
}

export const DEFAULT_VM_CONFIG: VMConfig = {
  id: 'vm-default',
  quotas: DEFAULT_VM_QUOTAS,
  enableSharedMemory: true,
  enableTimestamps: true,
  enablePipelineCache: true,
  allowedSyscalls: null, // All syscalls allowed
  initialMemoryPages: 256, // 16 MiB
  maxMemoryPages: 1024, // 64 MiB
};

// ─── Inter-VM Communication Types (ML) ────────────────────────────────────────

export interface VMMessageQueueDescriptor {
  /** Shared ring buffer (SharedArrayBuffer). */
  buffer: SharedArrayBuffer;
  /** Producer index (atomic). */
  producerIndex: Int32Array;
  /** Consumer index (atomic). */
  consumerIndex: Int32Array;
  /** Ring buffer capacity. */
  capacity: number;
  /** Message size in bytes. */
  messageSize: number;
}

export interface VMEventChannel {
  /** Flag address in SharedArrayBuffer. */
  flagAddress: number;
  /** Shared buffer containing the flag. */
  buffer: SharedArrayBuffer;
  /** Int32 view of the buffer. */
  view: Int32Array;
}

// ─── VM State (ML) ────────────────────────────────────────────────────────────

export interface VMState {
  config: VMConfig;
  device: GPUDevice;
  queue: GPUQueue;
  wasmInstance: WebAssembly.Instance | null;
  wasmMemories: Map<number, WasmLinearMemory>;
  buffers: Map<BufferHandle, GPUBufferDescriptor>;
  pipelines: Map<PipelineHandle, ComputePipelineDescriptor>;
  bindGroups: Map<BindGroupHandle, BindGroupDescriptor>;
  commandState: CommandBufferState;
  counters: VMPerformanceCounters;
  totalGPUMemoryUsed: bigint;
  nextBufferHandle: BufferHandle;
  nextPipelineHandle: PipelineHandle;
  nextBindGroupHandle: BindGroupHandle;
}
