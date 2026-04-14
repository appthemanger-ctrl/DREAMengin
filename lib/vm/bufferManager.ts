/**
 * lib/vm/bufferManager.ts — GPU Buffer Management
 *
 * Manages GPUBuffer allocation, mapping, and lifecycle for the WASM+GPU VM.
 * Enforces resource quotas and tracks memory usage.
 */

import { GPUBufferUsageFlags, VMErrorCode } from './types';
import type { BufferHandle, GPUBufferDescriptor, VMResourceQuotas, VMPerformanceCounters } from './types';

export class BufferManager {
  private readonly buffers = new Map<BufferHandle, GPUBufferDescriptor>();
  private nextHandle: BufferHandle = 1;
  private totalMemoryUsed = 0n;

  constructor(
    private readonly device: GPUDevice,
    private readonly quotas: VMResourceQuotas,
    private readonly counters: VMPerformanceCounters,
  ) {}

  /**
   * Allocate a new GPU buffer.
   *
   * @returns BufferHandle on success, or VMErrorCode on failure.
   */
  create(usage: number, size: bigint): BufferHandle | VMErrorCode {
    // Quota checks
    if (this.buffers.size >= this.quotas.maxGPUBufferCount) {
      return VMErrorCode.RESOURCE_LIMIT_EXCEEDED;
    }
    if (size > this.quotas.maxGPUBufferSize) {
      return VMErrorCode.RESOURCE_LIMIT_EXCEEDED;
    }
    if (this.totalMemoryUsed + size > this.quotas.maxTotalGPUMemory) {
      return VMErrorCode.OUT_OF_MEMORY;
    }

    // Validate usage flags
    if (!this.validateUsage(usage)) {
      return VMErrorCode.INVALID_ARGUMENT;
    }

    try {
      const buffer = this.device.createBuffer({
        size: Number(size),
        usage: this.usageFlagsToGPU(usage),
        mappedAtCreation: false,
      });

      const handle = this.nextHandle++;
      this.buffers.set(handle, {
        handle,
        size,
        usage,
        buffer,
        mappedRange: null,
      });

      this.totalMemoryUsed += size;
      return handle;
    } catch (error) {
      console.error('[BufferManager] Failed to create buffer:', error);
      return VMErrorCode.GPU_ERROR;
    }
  }

  /**
   * Destroy a GPU buffer and reclaim its memory.
   */
  destroy(handle: BufferHandle): VMErrorCode {
    const descriptor = this.buffers.get(handle);
    if (!descriptor) {
      return VMErrorCode.INVALID_HANDLE;
    }

    descriptor.buffer.destroy();
    this.totalMemoryUsed -= descriptor.size;
    this.buffers.delete(handle);
    return VMErrorCode.SUCCESS;
  }

  /**
   * Get buffer descriptor by handle.
   */
  get(handle: BufferHandle): GPUBufferDescriptor | null {
    return this.buffers.get(handle) ?? null;
  }

  /**
   * Write data from WASM linear memory to GPU buffer.
   *
   * @param handle Target buffer handle.
   * @param wasmMemory WASM linear memory instance.
   * @param wasmPtr Pointer in WASM memory.
   * @param offset Byte offset in GPU buffer.
   * @param size Number of bytes to copy.
   */
  write(
    handle: BufferHandle,
    wasmMemory: WebAssembly.Memory,
    wasmPtr: number,
    offset: bigint,
    size: bigint,
  ): VMErrorCode {
    const descriptor = this.buffers.get(handle);
    if (!descriptor) {
      return 2; // INVALID_HANDLE
    }

    if (offset + size > descriptor.size) {
      return 3; // INVALID_ARGUMENT
    }

    try {
      const wasmView = new Uint8Array(wasmMemory.buffer, wasmPtr, Number(size));
      this.device.queue.writeBuffer(
        descriptor.buffer,
        Number(offset),
        wasmView.buffer,
        wasmView.byteOffset,
        wasmView.byteLength,
      );

      this.counters.totalBufferWrites++;
      this.counters.totalBytesWritten += size;
      return 0; // SUCCESS
    } catch (error) {
      console.error('[BufferManager] Write failed:', error);
      return 4; // GPU_ERROR
    }
  }

  /**
   * Read data from GPU buffer to WASM linear memory.
   *
   * @param handle Source buffer handle.
   * @param wasmMemory WASM linear memory instance.
   * @param wasmPtr Pointer in WASM memory.
   * @param offset Byte offset in GPU buffer.
   * @param size Number of bytes to copy.
   */
  async read(
    handle: BufferHandle,
    wasmMemory: WebAssembly.Memory,
    wasmPtr: number,
    offset: bigint,
    size: bigint,
  ): Promise<VMErrorCode> {
    const descriptor = this.buffers.get(handle);
    if (!descriptor) {
      return 2; // INVALID_HANDLE
    }

    if (offset + size > descriptor.size) {
      return 3; // INVALID_ARGUMENT
    }

    // Create staging buffer for reading
    const stagingBuffer = this.device.createBuffer({
      size: Number(size),
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    try {
      // Copy GPU buffer → staging buffer
      const encoder = this.device.createCommandEncoder();
      encoder.copyBufferToBuffer(
        descriptor.buffer,
        Number(offset),
        stagingBuffer,
        0,
        Number(size),
      );
      this.device.queue.submit([encoder.finish()]);

      // Map staging buffer and copy to WASM memory
      await stagingBuffer.mapAsync(GPUMapMode.READ);
      const mappedRange = stagingBuffer.getMappedRange();
      const wasmView = new Uint8Array(wasmMemory.buffer, wasmPtr, Number(size));
      wasmView.set(new Uint8Array(mappedRange));
      stagingBuffer.unmap();
      stagingBuffer.destroy();

      this.counters.totalBufferReads++;
      this.counters.totalBytesRead += size;
      return 0; // SUCCESS
    } catch (error) {
      console.error('[BufferManager] Read failed:', error);
      stagingBuffer.destroy();
      return 4; // GPU_ERROR
    }
  }

  /**
   * Map a GPU buffer range into WASM linear memory (zero-copy).
   *
   * WARNING: This is an advanced operation that requires careful synchronization.
   * The buffer must have MAP_READ or MAP_WRITE usage.
   */
  async map(
    handle: BufferHandle,
    wasmMemory: WebAssembly.Memory,
    wasmPtr: number,
    offset: bigint,
    size: bigint,
    writable: boolean,
  ): Promise<VMErrorCode> {
    const descriptor = this.buffers.get(handle);
    if (!descriptor) {
      return 2; // INVALID_HANDLE
    }

    if (offset + size > descriptor.size) {
      return 3; // INVALID_ARGUMENT
    }

    const mode = writable ? GPUMapMode.WRITE : GPUMapMode.READ;
    const requiredUsage = writable ? 1 << 5 : 1 << 4; // MAP_WRITE or MAP_READ

    if ((descriptor.usage & requiredUsage) === 0) {
      return 3; // INVALID_ARGUMENT (buffer not mappable)
    }

    try {
      await descriptor.buffer.mapAsync(mode, Number(offset), Number(size));
      const mappedRange = descriptor.buffer.getMappedRange(Number(offset), Number(size));

      // Store mapped range for unmap operation
      descriptor.mappedRange = mappedRange;

      // Copy mapped data into WASM memory
      const wasmView = new Uint8Array(wasmMemory.buffer, wasmPtr, Number(size));
      wasmView.set(new Uint8Array(mappedRange));

      return 0; // SUCCESS
    } catch (error) {
      console.error('[BufferManager] Map failed:', error);
      return 4; // GPU_ERROR
    }
  }

  /**
   * Unmap a previously mapped buffer.
   */
  unmap(handle: BufferHandle): VMErrorCode {
    const descriptor = this.buffers.get(handle);
    if (!descriptor) {
      return 2; // INVALID_HANDLE
    }

    if (!descriptor.mappedRange) {
      return 3; // INVALID_ARGUMENT (buffer not mapped)
    }

    try {
      descriptor.buffer.unmap();
      descriptor.mappedRange = null;
      return 0; // SUCCESS
    } catch (error) {
      console.error('[BufferManager] Unmap failed:', error);
      return 4; // GPU_ERROR
    }
  }

  /**
   * Get total GPU memory used by all buffers.
   */
  getTotalMemoryUsed(): bigint {
    return this.totalMemoryUsed;
  }

  /**
   * Get number of allocated buffers.
   */
  getBufferCount(): number {
    return this.buffers.size;
  }

  /**
   * Destroy all buffers and reset state.
   */
  destroyAll(): void {
    for (const descriptor of this.buffers.values()) {
      descriptor.buffer.destroy();
    }
    this.buffers.clear();
    this.totalMemoryUsed = 0n;
    this.nextHandle = 1;
  }

  /**
   * Convert usage flags bitmask to GPUBufferUsageFlags.
   */
  private usageFlagsToGPU(usage: number): GPUBufferUsageFlags {
    const usageMap = typeof GPUBufferUsage === 'undefined' ? GPUBufferUsageFlags : GPUBufferUsage;
    let gpuUsage = 0;
    if (usage & (1 << 0)) gpuUsage |= usageMap.STORAGE;
    if (usage & (1 << 1)) gpuUsage |= usageMap.UNIFORM;
    if (usage & (1 << 2)) gpuUsage |= usageMap.COPY_SRC;
    if (usage & (1 << 3)) gpuUsage |= usageMap.COPY_DST;
    if (usage & (1 << 4)) gpuUsage |= usageMap.MAP_READ;
    if (usage & (1 << 5)) gpuUsage |= usageMap.MAP_WRITE;
    if (usage & (1 << 6)) gpuUsage |= usageMap.INDIRECT;
    if (usage & (1 << 7)) gpuUsage |= usageMap.VERTEX;
    if (usage & (1 << 8)) gpuUsage |= usageMap.INDEX;
    return gpuUsage;
  }

  /**
   * Validate that usage flags are reasonable.
   */
  private validateUsage(usage: number): boolean {
    // Cannot combine MAP_READ with MAP_WRITE
    const hasMapRead = (usage & (1 << 4)) !== 0;
    const hasMapWrite = (usage & (1 << 5)) !== 0;
    if (hasMapRead && hasMapWrite) return false;

    // Must have at least one usage flag
    if (usage === 0) return false;

    // No invalid bits set
    if (usage > 0b111111111) return false;

    return true;
  }
}
