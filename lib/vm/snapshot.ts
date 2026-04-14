/**
 * lib/vm/snapshot.ts — VM State Serialization and Snapshot Management
 *
 * Implements the binary snapshot format from the spec for VM state migration,
 * checkpointing, and debugging.
 */

import type {
  VMSnapshot,
  WasmMemorySnapshot,
  GPUBufferSnapshot,
  PipelineSnapshot,
  HandleTableSnapshot,
  BufferHandle,
  PipelineHandle,
  BindGroupHandle,
} from './types';
import type { WasmGpuVM } from './wasmGpuVM';

const SNAPSHOT_MAGIC = 'VMSN';
const SNAPSHOT_VERSION = 1;

export class SnapshotManager {
  /**
   * Create a snapshot of the current VM state.
   */
  static async createSnapshot(vm: WasmGpuVM): Promise<VMSnapshot> {
    const stats = vm.getStats();
    const state = (vm as unknown as {state: {
      wasmMemories: Map<number, {id: number; memory: WebAssembly.Memory; shared: boolean; pages: number}>;
      buffers: Map<BufferHandle, {handle: BufferHandle; size: bigint; usage: number; buffer: GPUBuffer}>;
      pipelines: Map<PipelineHandle, {handle: PipelineHandle; wgslSource: string; sourceHash: string}>;
      nextBufferHandle: BufferHandle;
      nextPipelineHandle: PipelineHandle;
      nextBindGroupHandle: BindGroupHandle;
      config: {quotas: unknown};
    }}).state;

    // Snapshot WASM memories
    const wasmMemories: WasmMemorySnapshot[] = [];
    for (const memory of state.wasmMemories.values()) {
      const data = new Uint8Array(memory.memory.buffer);
      wasmMemories.push({
        id: memory.id,
        size: BigInt(data.byteLength),
        data,
        shared: memory.shared,
      });
    }

    // Snapshot GPU buffers
    const gpuBuffers: GPUBufferSnapshot[] = [];
    for (const descriptor of state.buffers.values()) {
      const data = await this.readBufferData(descriptor.buffer, descriptor.size);
      gpuBuffers.push({
        handle: descriptor.handle,
        size: descriptor.size,
        usage: descriptor.usage,
        data,
      });
    }

    // Snapshot pipelines
    const pipelines: PipelineSnapshot[] = [];
    for (const descriptor of state.pipelines.values()) {
      const hashBytes = this.hexToBytes(descriptor.sourceHash);
      pipelines.push({
        sourceHash: hashBytes,
        wgslSource: descriptor.wgslSource,
        pipelineBlob: null, // WebGPU doesn't support binary pipeline serialization yet
      });
    }

    // Snapshot handle tables
    const handleState: HandleTableSnapshot = {
      nextFreeBuffer: state.nextBufferHandle,
      nextFreePipeline: state.nextPipelineHandle,
      nextFreeBindGroup: state.nextBindGroupHandle,
      allocatedBuffers: Array.from(state.buffers.keys()),
      allocatedPipelines: Array.from(state.pipelines.keys()),
      allocatedBindGroups: [], // TODO: track bind groups
    };

    return {
      version: SNAPSHOT_VERSION,
      timestamp: Date.now(),
      wasmMemories,
      gpuBuffers,
      pipelines,
      handleState,
      quotas: state.config.quotas as never,
    };
  }

  /**
   * Serialize a snapshot to binary format.
   */
  static serializeSnapshot(snapshot: VMSnapshot): Uint8Array {
    const parts: Uint8Array[] = [];

    // Header
    parts.push(this.encodeString(SNAPSHOT_MAGIC));
    parts.push(this.encodeU32(snapshot.version));
    parts.push(this.encodeU64(BigInt(snapshot.timestamp)));

    // WASM memories
    parts.push(this.encodeU32(snapshot.wasmMemories.length));
    for (const memory of snapshot.wasmMemories) {
      parts.push(this.encodeU32(memory.id));
      parts.push(this.encodeU64(memory.size));
      parts.push(this.encodeU8(memory.shared ? 1 : 0));
      parts.push(this.encodeU64(BigInt(memory.data.byteLength)));
      parts.push(memory.data);
    }

    // GPU buffers
    parts.push(this.encodeU32(snapshot.gpuBuffers.length));
    for (const buffer of snapshot.gpuBuffers) {
      parts.push(this.encodeU32(buffer.handle));
      parts.push(this.encodeU64(buffer.size));
      parts.push(this.encodeU32(buffer.usage));
      parts.push(this.encodeU64(BigInt(buffer.data.byteLength)));
      parts.push(buffer.data);
    }

    // Pipelines
    parts.push(this.encodeU32(snapshot.pipelines.length));
    for (const pipeline of snapshot.pipelines) {
      parts.push(pipeline.sourceHash); // 32 bytes
      const wgslBytes = new TextEncoder().encode(pipeline.wgslSource);
      parts.push(this.encodeU32(wgslBytes.byteLength));
      parts.push(wgslBytes);
      parts.push(this.encodeU32(pipeline.pipelineBlob?.byteLength ?? 0));
      if (pipeline.pipelineBlob) {
        parts.push(pipeline.pipelineBlob);
      }
    }

    // Handle table state
    parts.push(this.encodeU32(snapshot.handleState.nextFreeBuffer));
    parts.push(this.encodeU32(snapshot.handleState.nextFreePipeline));
    parts.push(this.encodeU32(snapshot.handleState.nextFreeBindGroup));
    parts.push(this.encodeU32(snapshot.handleState.allocatedBuffers.length));
    for (const handle of snapshot.handleState.allocatedBuffers) {
      parts.push(this.encodeU32(handle));
    }
    parts.push(this.encodeU32(snapshot.handleState.allocatedPipelines.length));
    for (const handle of snapshot.handleState.allocatedPipelines) {
      parts.push(this.encodeU32(handle));
    }

    // Combine all parts
    const totalSize = parts.reduce((sum, part) => sum + part.byteLength, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.byteLength;
    }

    return result;
  }

  /**
   * Deserialize a snapshot from binary format.
   */
  static deserializeSnapshot(data: Uint8Array): VMSnapshot {
    let offset = 0;

    // Helper to read bytes
    const read = (count: number): Uint8Array => {
      const slice = data.slice(offset, offset + count);
      offset += count;
      return slice;
    };

    const readU8 = (): number => read(1)[0];
    const readU32 = (): number => new DataView(read(4).buffer).getUint32(0, true);
    const readU64 = (): bigint => new DataView(read(8).buffer).getBigUint64(0, true);

    // Header
    const magic = new TextDecoder().decode(read(4));
    if (magic !== SNAPSHOT_MAGIC) {
      throw new Error(`Invalid snapshot magic: ${magic}`);
    }

    const version = readU32();
    if (version !== SNAPSHOT_VERSION) {
      throw new Error(`Unsupported snapshot version: ${version}`);
    }

    const timestamp = Number(readU64());

    // WASM memories
    const wasmMemoriesCount = readU32();
    const wasmMemories: WasmMemorySnapshot[] = [];
    for (let i = 0; i < wasmMemoriesCount; i++) {
      const id = readU32();
      const size = readU64();
      const shared = readU8() === 1;
      const dataLen = Number(readU64());
      const data = read(dataLen);
      wasmMemories.push({ id, size, shared, data });
    }

    // GPU buffers
    const gpuBuffersCount = readU32();
    const gpuBuffers: GPUBufferSnapshot[] = [];
    for (let i = 0; i < gpuBuffersCount; i++) {
      const handle = readU32();
      const size = readU64();
      const usage = readU32();
      const dataLen = Number(readU64());
      const data = read(dataLen);
      gpuBuffers.push({ handle, size, usage, data });
    }

    // Pipelines
    const pipelinesCount = readU32();
    const pipelines: PipelineSnapshot[] = [];
    for (let i = 0; i < pipelinesCount; i++) {
      const sourceHash = read(32);
      const wgslLen = readU32();
      const wgslBytes = read(wgslLen);
      const wgslSource = new TextDecoder().decode(wgslBytes);
      const blobLen = readU32();
      const pipelineBlob = blobLen > 0 ? read(blobLen) : null;
      pipelines.push({ sourceHash, wgslSource, pipelineBlob });
    }

    // Handle table state
    const nextFreeBuffer = readU32();
    const nextFreePipeline = readU32();
    const nextFreeBindGroup = readU32();

    const allocatedBuffersCount = readU32();
    const allocatedBuffers: number[] = [];
    for (let i = 0; i < allocatedBuffersCount; i++) {
      allocatedBuffers.push(readU32());
    }

    const allocatedPipelinesCount = readU32();
    const allocatedPipelines: number[] = [];
    for (let i = 0; i < allocatedPipelinesCount; i++) {
      allocatedPipelines.push(readU32());
    }

    const handleState: HandleTableSnapshot = {
      nextFreeBuffer,
      nextFreePipeline,
      nextFreeBindGroup,
      allocatedBuffers,
      allocatedPipelines,
      allocatedBindGroups: [],
    };

    return {
      version,
      timestamp,
      wasmMemories,
      gpuBuffers,
      pipelines,
      handleState,
      quotas: {} as never, // TODO: serialize quotas
    };
  }

  /**
   * Read all data from a GPU buffer.
   */
  private static async readBufferData(
    buffer: GPUBuffer,
    size: bigint,
  ): Promise<Uint8Array> {
    const device = buffer as {__brand: 'GPUBuffer'; label: string} & GPUBuffer;
    // Get device from buffer (hack - in production, pass device explicitly)
    const stagingBuffer = device.constructor.prototype.constructor.call(
      null,
      {
        size: Number(size),
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      },
    );

    // In production, would need access to the device's command encoder
    // This is a simplified version
    const result = new Uint8Array(Number(size));
    return result; // TODO: implement actual copy
  }

  // ─── Binary encoding helpers ──────────────────────────────────────────────

  private static encodeString(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private static encodeU8(value: number): Uint8Array {
    return new Uint8Array([value]);
  }

  private static encodeU32(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, value, true);
    return new Uint8Array(buffer);
  }

  private static encodeU64(value: bigint): Uint8Array {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setBigUint64(0, value, true);
    return new Uint8Array(buffer);
  }

  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
