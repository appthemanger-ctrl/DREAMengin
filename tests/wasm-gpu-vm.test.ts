/**
 * tests/wasm-gpu-vm.test.ts — WASM+GPU VM Integration Tests
 *
 * Comprehensive test suite for the dual WASM+GPU virtual machine.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock WebGPU API for testing
const mockDevice = {
  createBuffer: vi.fn(() => ({
    destroy: vi.fn(),
    mapAsync: vi.fn(() => Promise.resolve()),
    getMappedRange: vi.fn(() => new ArrayBuffer(1024)),
    unmap: vi.fn(),
  })),
  createCommandEncoder: vi.fn(() => ({
    beginComputePass: vi.fn(() => ({
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      dispatchWorkgroups: vi.fn(),
      dispatchWorkgroupsIndirect: vi.fn(),
      end: vi.fn(),
    })),
    finish: vi.fn(() => ({})),
    copyBufferToBuffer: vi.fn(),
  })),
  createShaderModule: vi.fn(() => ({
    getCompilationInfo: vi.fn(() => Promise.resolve({ messages: [] })),
  })),
  createComputePipelineAsync: vi.fn(() => Promise.resolve({
    getBindGroupLayout: vi.fn(() => ({})),
  })),
  queue: {
    submit: vi.fn(),
    writeBuffer: vi.fn(),
    onSubmittedWorkDone: vi.fn(() => Promise.resolve()),
  },
  features: new Set(['timestamp-query']),
  destroy: vi.fn(),
};

const mockAdapter = {
  requestDevice: vi.fn(() => Promise.resolve(mockDevice)),
};

const mockGPU = {
  requestAdapter: vi.fn(() => Promise.resolve(mockAdapter)),
};

// Mock global navigator.gpu
vi.stubGlobal('navigator', { gpu: mockGPU });

describe('WASM+GPU VM Core', () => {
  describe('VM Types and Interfaces', () => {
    it('should define all required handle types', async () => {
      const { GPUBufferUsageFlags, ErrorCode } = await import('@/lib/vm/types');

      expect(GPUBufferUsageFlags.STORAGE).toBe(1 << 0);
      expect(GPUBufferUsageFlags.UNIFORM).toBe(1 << 1);
      expect(GPUBufferUsageFlags.COPY_SRC).toBe(1 << 2);
      expect(ErrorCode.SUCCESS).toBe(0);
      expect(ErrorCode.OUT_OF_MEMORY).toBe(1);
      expect(ErrorCode.INVALID_HANDLE).toBe(2);
    });

    it('should provide default VM configuration', async () => {
      const { DEFAULT_VM_CONFIG } = await import('@/lib/vm/types');

      expect(DEFAULT_VM_CONFIG.id).toBe('vm-default');
      expect(DEFAULT_VM_CONFIG.quotas.maxGPUBufferCount).toBe(2048);
      expect(DEFAULT_VM_CONFIG.enableSharedMemory).toBe(true);
      expect(DEFAULT_VM_CONFIG.enableTimestamps).toBe(true);
    });
  });

  describe('Buffer Manager', () => {
    it('should enforce buffer count quota', async () => {
      const { BufferManager } = await import('@/lib/vm/bufferManager');

      const quotas = {
        maxGPUBufferCount: 2,
        maxGPUBufferSize: 1024n * 1024n,
        maxTotalGPUMemory: 1024n * 1024n * 1024n,
        maxWasmMemoryPages: 1024,
        maxPipelineCount: 256,
        maxBindGroupCount: 4096,
        maxDispatchSize: 65535,
        maxComputeTimeMs: 100,
        maxCommandBufferLength: 65535,
      };

      const counters = {
        totalDispatches: 0n,
        totalBufferWrites: 0n,
        totalBufferReads: 0n,
        totalBytesWritten: 0n,
        totalBytesRead: 0n,
        totalGPUTimeNs: 0n,
        totalWasmInstructions: 0n,
        pipelineCacheHits: 0,
        pipelineCacheMisses: 0,
      };

      const manager = new BufferManager(mockDevice as never, quotas, counters);

      const handle1 = manager.create(1, 1024n); // STORAGE
      expect(handle1).toBeGreaterThanOrEqual(1);

      const handle2 = manager.create(1, 1024n);
      expect(handle2).toBeGreaterThanOrEqual(1);

      const handle3 = manager.create(1, 1024n);
      expect(handle3).toBe(5); // RESOURCE_LIMIT_EXCEEDED
    });

    it('should track total GPU memory usage', async () => {
      const { BufferManager } = await import('@/lib/vm/bufferManager');

      const quotas = {
        maxGPUBufferCount: 100,
        maxGPUBufferSize: 1024n * 1024n,
        maxTotalGPUMemory: 2048n,
        maxWasmMemoryPages: 1024,
        maxPipelineCount: 256,
        maxBindGroupCount: 4096,
        maxDispatchSize: 65535,
        maxComputeTimeMs: 100,
        maxCommandBufferLength: 65535,
      };

      const counters = {
        totalDispatches: 0n,
        totalBufferWrites: 0n,
        totalBufferReads: 0n,
        totalBytesWritten: 0n,
        totalBytesRead: 0n,
        totalGPUTimeNs: 0n,
        totalWasmInstructions: 0n,
        pipelineCacheHits: 0,
        pipelineCacheMisses: 0,
      };

      const manager = new BufferManager(mockDevice as never, quotas, counters);

      manager.create(1, 1024n);
      expect(manager.getTotalMemoryUsed()).toBe(1024n);

      manager.create(1, 512n);
      expect(manager.getTotalMemoryUsed()).toBe(1536n);

      const handle3 = manager.create(1, 1024n);
      expect(handle3).toBe(1); // OUT_OF_MEMORY
    });
  });

  describe('Pipeline Cache', () => {
    it('should cache compiled pipelines', async () => {
      const { PipelineCache } = await import('@/lib/vm/pipelineCache');

      const cache = new PipelineCache(mockDevice as never);

      const wgsl = '@compute @workgroup_size(64) fn main() {}';
      const result1 = await cache.getOrCreate(wgsl);

      expect(result1.pipeline).toBeDefined();
      expect(result1.cacheHit).toBe(false);

      const result2 = await cache.getOrCreate(wgsl);
      expect(result2.cacheHit).toBe(true);
      expect(result2.sourceHash).toBe(result1.sourceHash);
    });
  });

  describe('Snapshot Manager', () => {
    it('should serialize and deserialize snapshots', async () => {
      const { SnapshotManager } = await import('@/lib/vm/snapshot');

      const snapshot = {
        version: 1,
        timestamp: Date.now(),
        wasmMemories: [
          {
            id: 0,
            size: 1024n,
            data: new Uint8Array(1024),
            shared: false,
          },
        ],
        gpuBuffers: [],
        pipelines: [],
        handleState: {
          nextFreeBuffer: 1,
          nextFreePipeline: 1,
          nextFreeBindGroup: 1,
          allocatedBuffers: [],
          allocatedPipelines: [],
          allocatedBindGroups: [],
        },
        quotas: {} as never,
      };

      const serialized = SnapshotManager.serializeSnapshot(snapshot);
      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(serialized.byteLength).toBeGreaterThan(0);

      const deserialized = SnapshotManager.deserializeSnapshot(serialized);
      expect(deserialized.version).toBe(snapshot.version);
      expect(deserialized.wasmMemories.length).toBe(1);
      expect(deserialized.wasmMemories[0].id).toBe(0);
    });
  });
});

describe('Dual VM Coordinator', () => {
  it('should provide global coordinator singleton', async () => {
    const { initializeDualVMCoordinator, getDualVMCoordinator, destroyDualVMCoordinator } =
      await import('@/lib/vm/dualVMCoordinator');

    // Initially no coordinator
    expect(getDualVMCoordinator()).toBeNull();

    // Initialize creates coordinator
    const coordinator = await initializeDualVMCoordinator({
      enableInterVMCommunication: false, // Disable for testing
    });
    expect(coordinator).toBeDefined();
    expect(getDualVMCoordinator()).toBe(coordinator);

    // Destroy clears coordinator
    destroyDualVMCoordinator();
    expect(getDualVMCoordinator()).toBeNull();
  });

  it('should track active workloads', async () => {
    const { initializeDualVMCoordinator, destroyDualVMCoordinator } =
      await import('@/lib/vm/dualVMCoordinator');

    const coordinator = await initializeDualVMCoordinator({
      enableInterVMCommunication: false,
    });

    const stats = coordinator.getStats();
    expect(stats.activeWorkloads).toEqual([]);

    destroyDualVMCoordinator();
  });
});

describe('Integration: VM Specification Compliance', () => {
  it('should implement all required syscalls', async () => {
    const { WasmGpuVM } = await import('@/lib/vm/wasmGpuVM');

    const vm = await WasmGpuVM.create({
      id: 'test-vm',
      enablePipelineCache: false,
    });

    const syscalls = vm.getSyscalls();

    // Check all syscalls exist
    expect(syscalls.vm_buffer_create).toBeInstanceOf(Function);
    expect(syscalls.vm_buffer_destroy).toBeInstanceOf(Function);
    expect(syscalls.vm_buffer_write).toBeInstanceOf(Function);
    expect(syscalls.vm_buffer_read).toBeInstanceOf(Function);
    expect(syscalls.vm_buffer_map).toBeInstanceOf(Function);
    expect(syscalls.vm_buffer_unmap).toBeInstanceOf(Function);
    expect(syscalls.vm_compute_pipeline_create).toBeInstanceOf(Function);
    expect(syscalls.vm_compute_pipeline_destroy).toBeInstanceOf(Function);
    expect(syscalls.vm_bind_group_create).toBeInstanceOf(Function);
    expect(syscalls.vm_bind_group_destroy).toBeInstanceOf(Function);
    expect(syscalls.vm_command_begin).toBeInstanceOf(Function);
    expect(syscalls.vm_command_set_pipeline).toBeInstanceOf(Function);
    expect(syscalls.vm_command_set_bind_group).toBeInstanceOf(Function);
    expect(syscalls.vm_command_dispatch).toBeInstanceOf(Function);
    expect(syscalls.vm_command_dispatch_indirect).toBeInstanceOf(Function);
    expect(syscalls.vm_submit).toBeInstanceOf(Function);
    expect(syscalls.vm_wait_fence).toBeInstanceOf(Function);
    expect(syscalls.vm_get_time).toBeInstanceOf(Function);
    expect(syscalls.vm_yield).toBeInstanceOf(Function);
    expect(syscalls.vm_get_instruction_count).toBeInstanceOf(Function);

    vm.destroy();
  });

  it('should report performance counters', async () => {
    const { WasmGpuVM } = await import('@/lib/vm/wasmGpuVM');

    const vm = await WasmGpuVM.create({
      id: 'test-vm',
      enablePipelineCache: false,
    });

    const stats = vm.getStats();

    expect(stats.counters).toBeDefined();
    expect(stats.counters.totalDispatches).toBe(0n);
    expect(stats.counters.totalBufferWrites).toBe(0n);
    expect(stats.counters.totalBufferReads).toBe(0n);
    expect(stats.bufferCount).toBe(0);
    expect(stats.pipelineCount).toBe(0);

    vm.destroy();
  });
});
