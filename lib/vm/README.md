# WASM+GPU Virtual Machine

> **Production-Ready Dual Runtime VM Implementation**
> **Architecture:** WebAssembly 2.0 + WebGPU Compute
> **Integration:** DREAMengin Dual Runtime Bridge

## Overview

A complete implementation of the WASM+GPU Virtual Machine specification for DREAMengin. Provides high-performance compute capabilities via WebAssembly SIMD and WebGPU, with full dual-runtime support.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dual VM Coordinator                       │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │   Left VM        │           │   Right VM       │        │
│  │  (Primary)       │◄─────────►│  (Secondary)     │        │
│  └──────────────────┘           └──────────────────┘        │
│         │                               │                    │
│         ├─── WASM Engine                ├─── WASM Engine    │
│         ├─── WebGPU Device              ├─── WebGPU Device  │
│         ├─── Buffer Manager             ├─── Buffer Manager │
│         └─── Pipeline Cache              └─── Pipeline Cache │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Dual Runtime Bridge   │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │     Dream OS Bus       │
              └────────────────────────┘
```

## Features

### Core VM Capabilities
- ✅ **WebAssembly 2.0**: Full spec compliance (SIMD, threads, bulk memory, multi-memory)
- ✅ **WebGPU Compute**: GPU-accelerated compute pipelines with WGSL shaders
- ✅ **Shared Memory**: SharedArrayBuffer-backed linear memory for zero-copy operations
- ✅ **Syscall ABI**: 20 syscalls for buffer operations, pipeline management, and dispatch
- ✅ **Resource Quotas**: Configurable limits on memory, buffers, pipelines, and compute time
- ✅ **Pipeline Caching**: Persistent shader compilation cache via IndexedDB

### Advanced Features
- ✅ **Dual Runtime**: Left/Right VM coordination for parallel processing
- ✅ **Inter-VM Communication**: Message queues and event channels via SharedArrayBuffer atomics
- ✅ **Snapshot/Restore**: Binary serialization for state migration and debugging
- ✅ **Performance Counters**: GPU timestamps, buffer I/O tracking, pipeline cache stats
- ✅ **Security Isolation**: Memory bounds checking, syscall allow-lists, GPU time slicing

## Quick Start

### Initialize Dual VM Coordinator

```typescript
import { initializeDualVMCoordinator } from '@/lib/vm';

const coordinator = await initializeDualVMCoordinator({
  left: {
    id: 'vm-left',
    quotas: {
      maxGPUBufferSize: 256n * 1024n * 1024n, // 256 MiB
      maxTotalGPUMemory: 1024n * 1024n * 1024n, // 1 GiB
    },
  },
  right: {
    id: 'vm-right',
    quotas: {
      maxGPUBufferSize: 256n * 1024n * 1024n,
      maxTotalGPUMemory: 1024n * 1024n * 1024n,
    },
  },
  enableInterVMCommunication: true,
  primaryRegion: 'left',
});
```

### Submit a Workload

```typescript
import { getDualVMCoordinator } from '@/lib/vm';

const coordinator = getDualVMCoordinator();

await coordinator.submitWorkload({
  id: 'compute-task-1',
  region: 'left',
  wasmBinary: wasmModule, // Your compiled WASM binary
  channel: 'compute',
  priority: 1,
});
```

### Direct VM Usage

```typescript
import { WasmGpuVM } from '@/lib/vm';

const vm = await WasmGpuVM.create({
  id: 'standalone-vm',
  enableSharedMemory: true,
  enableTimestamps: true,
  enablePipelineCache: true,
});

await vm.loadWasm(wasmBinary);

const syscalls = vm.getSyscalls();

// Allocate GPU buffer
const bufferHandle = syscalls.vm_buffer_create(
  1 << 0 | 1 << 2 | 1 << 3, // STORAGE | COPY_SRC | COPY_DST
  4096n, // 4 KiB
);

// Create compute pipeline
const wgsl = `
  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // Your compute shader
  }
`;
const encoder = new TextEncoder();
const wgslBytes = encoder.encode(wgsl);
const pipelineHandle = syscalls.vm_compute_pipeline_create(0, wgslBytes.length);

// Dispatch compute
syscalls.vm_command_begin();
syscalls.vm_command_set_pipeline(pipelineHandle);
syscalls.vm_command_dispatch(64, 1, 1);
syscalls.vm_submit();
syscalls.vm_wait_fence();

// Read results
const output = new Uint32Array(1024);
syscalls.vm_buffer_read(bufferHandle, 0, 0n, 4096n);
```

## System Call Reference

| Syscall | Signature | Description |
|---------|-----------|-------------|
| `vm_buffer_create` | `(usage: u32, size: u64) -> u32` | Allocate GPU buffer |
| `vm_buffer_destroy` | `(handle: u32) -> u32` | Destroy GPU buffer |
| `vm_buffer_write` | `(handle: u32, ptr: u32, offset: u64, size: u64) -> u32` | Copy WASM→GPU |
| `vm_buffer_read` | `(handle: u32, ptr: u32, offset: u64, size: u64) -> u32` | Copy GPU→WASM |
| `vm_buffer_map` | `(handle: u32, ptr: u32, offset: u64, size: u64, writable: u32) -> u32` | Zero-copy map |
| `vm_buffer_unmap` | `(handle: u32) -> u32` | Unmap buffer |
| `vm_compute_pipeline_create` | `(wgsl_ptr: u32, wgsl_len: u32) -> u32` | Compile WGSL shader |
| `vm_compute_pipeline_destroy` | `(handle: u32) -> u32` | Destroy pipeline |
| `vm_command_begin` | `() -> u32` | Start command buffer |
| `vm_command_set_pipeline` | `(pipeline: u32) -> u32` | Set active pipeline |
| `vm_command_dispatch` | `(x: u32, y: u32, z: u32) -> u32` | Dispatch workgroups |
| `vm_submit` | `() -> u32` | Submit to GPU queue |
| `vm_wait_fence` | `() -> u32` | Wait for GPU completion |
| `vm_get_time` | `() -> u64` | Monotonic time (ns) |
| `vm_yield` | `() -> u32` | Scheduler hint |

## Error Codes

- `0` — SUCCESS
- `1` — OUT_OF_MEMORY
- `2` — INVALID_HANDLE
- `3` — INVALID_ARGUMENT
- `4` — GPU_ERROR
- `5` — RESOURCE_LIMIT_EXCEEDED

## Performance Monitoring

```typescript
const stats = vm.getStats();

console.log('Dispatches:', stats.counters.totalDispatches);
console.log('GPU Memory:', stats.totalGPUMemory);
console.log('Pipeline Cache Hits:', stats.counters.pipelineCacheHits);
console.log('Pipeline Cache Misses:', stats.counters.pipelineCacheMisses);
```

## Inter-VM Communication

```typescript
import { getDualVMCoordinator } from '@/lib/vm';

const coordinator = getDualVMCoordinator();

// Create message queue
const message = new TextEncoder().encode('Hello from left VM');
coordinator.sendInterVMMessage('left', 'right', message);

// Create event channel
const channel = coordinator.createEventChannel('sync-event');
coordinator.signalEventChannel('sync-event', 1);
```

## Testing

```bash
# Run VM tests
pnpm test tests/wasm-gpu-vm.test.ts

# Run with coverage
pnpm test --coverage tests/wasm-gpu-vm.test.ts
```

## Architecture Notes

### Why Dual VMs?

DREAMengin's split-screen architecture requires independent compute contexts for each runtime region. The dual VM setup enables:

1. **Parallel Processing**: Left and right regions can run compute workloads simultaneously
2. **Failover**: If one VM crashes, the other continues operating
3. **Load Balancing**: Distribute heavy compute tasks across both VMs
4. **Isolation**: Each region maintains its own resource quotas and security context

### Integration with Dual Runtime Bridge

The VM coordinator publishes events to the `dualRuntimeBridge`:

- `vm:workload-submitted` — Workload dispatched to a region
- `vm:compute-complete` — Compute kernel finished
- `vm:error` — VM error occurred
- `vm:stats-update` — Periodic performance statistics

### GPU Resource Management

- Buffers are allocated from the GPU device's memory pool (VRAM or unified memory)
- Pipeline compilation is cached in IndexedDB to avoid re-compilation
- Resource quotas prevent any single VM from exhausting GPU memory
- Time slicing ensures fair GPU access across workloads

## Files

- `lib/vm/types.ts` — Type definitions
- `lib/vm/wasmGpuVM.ts` — Core VM implementation
- `lib/vm/bufferManager.ts` — GPU buffer allocation
- `lib/vm/pipelineCache.ts` — Shader compilation cache
- `lib/vm/snapshot.ts` — State serialization
- `lib/vm/dualVMCoordinator.ts` — Dual VM orchestration
- `tests/wasm-gpu-vm.test.ts` — Integration tests

## Specification

See [`docs/wasm_gpu_vm_spec.md`](../../docs/wasm_gpu_vm_spec.md) for the complete specification.

## License

Part of the DREAMengin project. See root LICENSE for details.
