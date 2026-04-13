# WASM+GPU Virtual Machine – Specification

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)
> **Documentation Date:** 2026-04-13
> **Implementation Status:** Production-Ready

## Notation
- **LL** = low‑level (bits, bytes, opcodes, registers, memory layout)
- **ML** = mid‑level (subsystems, APIs, data structures, component interactions)

---

## 1. Memory Model

### 1.1 Linear Memory (LL)
- Each WASM instance has at least one linear memory (memory section).
- Memory is a contiguous byte array, indexed from 0 to `(initial_pages * 65536) - 1`.
- Maximum pages: 65536 (4 GiB). Page size: 65536 bytes.
- Multiple memories allowed (indexed 0..N-1). Each memory has its own base address and length.
- Memory operations: `i32.load`, `i32.store`, `i64.load`, `i64.store`, `v128.load`, `v128.store`, `memory.copy`, `memory.fill`, `memory.init`, `data.drop`.
- Shared memory: flag `shared` in memory type; underlying buffer must be a `SharedArrayBuffer`.
- Atomic operations (on shared memory): `i32.atomic.rmw.add`, `i32.atomic.cmpxchg`, `i32.atomic.wait`, `i32.atomic.notify`, etc.

### 1.2 GPU Buffers (LL)
Each GPUBuffer is described by:
- `size` (bytes)
- `usage` bitmask:
  - `STORAGE (1<<0)`
  - `UNIFORM (1<<1)`
  - `COPY_SRC (1<<2)`
  - `COPY_DST (1<<3)`
  - `MAP_READ (1<<4)`
  - `MAP_WRITE (1<<5)`
  - `INDIRECT (1<<6)`
  - `VERTEX (1<<7)`
  - `INDEX (1<<8)`
- `mappedAtCreation` boolean

Buffers are allocated from the GPU device's memory pool (VRAM or system RAM if unified memory).

**Alignment**: storage buffers must be aligned to 4 bytes for scalar access, 16 bytes for vectors.

### 1.3 SharedArrayBuffer (LL)
- A `SharedArrayBuffer` is a raw byte buffer that can be shared across multiple Web Workers and WASM instances.
- All atomic operations are performed on `SharedArrayBuffer` (not directly on WASM linear memory unless the linear memory is backed by a `SharedArrayBuffer`).
- To use atomics inside WASM, the linear memory must be a `SharedArrayBuffer`.

### 1.4 Address Space Layout (ML)
Each VM has:
- **WASM linear memory(s)** – guest‑visible, host‑backed by ArrayBuffer or SharedArrayBuffer.
- **GPU buffers** – referenced by handles (opaque integer IDs), not directly addressable by WASM.
- **Staging buffers** – temporary buffers used for CPU–GPU transfer.
- **Host‑side metadata**: per‑VM handle table, resource quotas, pipeline cache.

---

## 2. Execution Engines

### 2.1 WASM Engine (ML)
- Must implement the WebAssembly 2.0 specification (core, threads, SIMD, bulk memory, multi‑memory, reference types).
- Can be interpreter, baseline JIT, optimizing JIT, or AOT.
- Must provide trap handling: unreachable, memory out of bounds, division by zero, invalid conversion, indirect call null, table out of bounds.
- Must expose host‑defined imported functions (syscalls) via import section.

### 2.2 WebGPU Device (ML)
- Created via `GPUAdapter.requestDevice()` with required features: `"timestamp-query"`, `"indirect-first-instance"`, optionally `"shader-f16"`.
- Device has one default `GPUQueue`.
- Device can create: `GPUBuffer`, `GPUTexture`, `GPUSampler`, `GPUBindGroupLayout`, `GPUPipelineLayout`, `GPUComputePipeline`, `GPURenderPipeline`, `GPUCommandEncoder`, `GPUQuerySet`.

### 2.3 Compute Pipeline (ML)
Composed of:
- `GPUComputePipeline` containing:
  - `GPUShaderModule` (WGSL compiled)
  - `GPUPipelineLayout` (sequence of bind group layouts)
- Pipeline layout defines the binding slots (group index, binding index) and visibility (compute, vertex, fragment).

### 2.4 Workgroup Dispatch (LL)
- Dispatch dimensions: `workgroup_count_x`, `workgroup_count_y`, `workgroup_count_z` (all uint32_t).
- Workgroup size defined in shader: `@workgroup_size(x, y, z)`.
- Maximum workgroup count per dimension: 65535.
- Indirect dispatch: dispatch counts read from a `GPUBuffer` at a given byte offset (must be 4‑byte aligned).

---

## 3. Synchronisation

### 3.1 WASM Atomics (LL)
- Memory order: `seq_cst` only (no weaker orders).
- `i32.atomic.wait(addr, expected, timeout_ns)` – blocks the calling thread until memory at addr equals expected or timeout expires. Returns 0 (woken), 1 (not equal), 2 (timeout).
- `i32.atomic.notify(addr, count)` – wakes up to count waiting threads.

### 3.2 GPU Synchronisation (LL)
- Command submission: `queue.submit([commandBuffer])` is non‑blocking.
- Timeline semaphores: not directly exposed in WebGPU, but `queue.onSubmittedWorkDone()` returns a Promise that resolves when all commands submitted so far are complete.
- Buffer mapping: `GPUBuffer.mapAsync(mode, offset, size)` returns a Promise that resolves when the buffer is available for CPU access.
- Pipeline barriers: within a compute pass, use `workgroupBarrier()` (synchronises within a workgroup) or `storageBarrier()` (synchronises memory accesses across workgroups). WGSL built‑ins: `workgroupBarrier()`, `storageBarrier()`, `textureBarrier()`.

### 3.3 Host‑Guest Synchronisation (ML)
- Guest calls `vm_submit()` → host records current command buffer, submits to queue, returns immediately.
- Guest calls `vm_wait_fence()` → host waits for `queue.onSubmittedWorkDone()` (or polls a mapped buffer flag).
- Alternative: guest spins on a `SharedArrayBuffer` flag written by the host when GPU work completes (requires host to write to that buffer via `queue.onSubmittedWorkDone` callback).

---

## 4. System Call ABI (ML)

The host exposes a set of imported functions to the WASM guest. All functions return 0 on success, non‑zero error code on failure.

| Import name | Signature | Description |
|-------------|-----------|-------------|
| `vm_buffer_create` | `(usage: u32, size: u64) -> u32` | Allocate a GPU buffer; returns handle (≥1). |
| `vm_buffer_destroy` | `(handle: u32) -> u32` | Destroy buffer. |
| `vm_buffer_write` | `(handle: u32, wasm_ptr: u32, offset: u64, size: u64) -> u32` | Copy from WASM linear memory to GPU buffer. |
| `vm_buffer_read` | `(handle: u32, wasm_ptr: u32, offset: u64, size: u64) -> u32` | Copy from GPU buffer to WASM linear memory. |
| `vm_buffer_map` | `(handle: u32, wasm_ptr: u32, offset: u64, size: u64, writable: u32) -> u32` | Map GPU buffer range into WASM linear memory (zero‑copy). |
| `vm_buffer_unmap` | `(handle: u32) -> u32` | Unmap buffer. |
| `vm_compute_pipeline_create` | `(wgsl_ptr: u32, wgsl_len: u32) -> u32` | Compile WGSL and create compute pipeline; returns handle. |
| `vm_compute_pipeline_destroy` | `(handle: u32) -> u32` | Destroy pipeline. |
| `vm_bind_group_create` | `(layout_handle: u32, bindings_ptr: u32, bindings_count: u32) -> u32` | Create bind group; returns handle. |
| `vm_bind_group_destroy` | `(handle: u32) -> u32` | Destroy bind group. |
| `vm_command_begin` | `() -> u32` | Start a new command buffer. |
| `vm_command_set_pipeline` | `(pipeline_handle: u32) -> u32` | Set active compute pipeline. |
| `vm_command_set_bind_group` | `(group_index: u32, bind_group_handle: u32, dynamic_offsets_ptr: u32, offset_count: u32) -> u32` | Set bind group. |
| `vm_command_dispatch` | `(x: u32, y: u32, z: u32) -> u32` | Dispatch workgroups. |
| `vm_command_dispatch_indirect` | `(buffer_handle: u32, offset: u64) -> u32` | Indirect dispatch. |
| `vm_submit` | `() -> u32` | Submit current command buffer to GPU queue. |
| `vm_wait_fence` | `() -> u32` | Wait for all submitted work to complete. |
| `vm_get_time` | `() -> u64` | Return monotonic time in nanoseconds. |
| `vm_yield` | `() -> u32` | Yield WASM thread (hint to scheduler). |

### Error codes (reserved range 1–65535):
- **1**: out of memory
- **2**: invalid handle
- **3**: invalid argument
- **4**: GPU error (e.g., shader compilation failed)
- **5**: resource limit exceeded

---

## 5. Resource Management (ML)

### 5.1 Handle Table
- Each VM has a per‑type handle table (arrays of pointers).
- Handle value 0 is reserved for null.
- Creation functions return the lowest unused handle ≥1.
- Destroy functions free the handle slot.

### 5.2 Resource Quotas (per VM)
- Max WASM linear memory pages: configurable (e.g., 1024 pages = 64 MiB).
- Max GPU buffer count: 2048.
- Max GPU buffer size: 256 MiB per buffer, 1 GiB total.
- Max pipeline count: 256.
- Max bind group count: 4096.
- Max dispatch size: 65535 per dimension.
- Max compute time per kernel: 100 ms (host watchdog).
- Max command buffer length: 65535 commands.

### 5.3 Pipeline Cache (ML)
- After `vm_compute_pipeline_create`, the compiled shader is stored in a persistent disk cache (IndexedDB) keyed by source hash + device features.
- On subsequent creations, if the cache entry exists, the pipeline is reconstructed from the cache to avoid re‑compilation.

---

## 6. State Serialisation (Snapshot) (ML)

### 6.1 Snapshot Format (binary)
```
[ header (magic "VMSN", version u32) ]
[ WASM linear memory count u32 ]
for each linear memory:
  [ memory_id u32, size u64, data ]
[ GPU buffer count u32 ]
for each GPU buffer:
  [ handle u32, size u64, usage u32, data (size bytes) ]
[ pipeline cache entries count u32 ]
for each pipeline:
  [ source_hash [32]u8, wgsl_len u32, wgsl_data, pipeline_blob_len u32, pipeline_blob_data ]
[ handle table state: next_free, allocated lists ]
[ quotas (all u64) ]
```

### 6.2 Restore Process
- Create new WASM instance, initialise linear memories from snapshot.
- Re‑create GPU buffers with same sizes and usages, upload data.
- Re‑create pipelines from cache blobs (or recompile if cache missing).
- Rebuild handle tables to match original handles.

---

## 7. Security Isolation (ML)
- **Memory isolation**: WASM linear memory cannot access host memory; GPU buffers are isolated by WebGPU's own validation.
- **Capability model**: each VM has a syscall allow‑list (e.g., disallow `vm_buffer_map` if guest not trusted).
- **GPU time slicing**: host submits command buffers with `queue.onSubmittedWorkDone` and can pre‑empt by not submitting further work until time slice expires.
- **Side‑channel mitigation**: all memory accesses are bounds‑checked; constant‑time operations required for crypto.

---

## 8. Inter‑VM Communication (optional) (ML)

Two VMs can communicate via:
- **Shared GPU buffer** – a `GPUBuffer` created with cross‑device sharing (requires GPUDevice extensions, not standard WebGPU; fallback to staging buffer via host).
- **Message queue** – host‑managed ring buffers in `SharedArrayBuffer` with atomic producer/consumer pointers.
- **Event channel** – one VM writes to a flag, the other spins on `i32.atomic.wait`.

---

## 9. Performance Counters (LL/ML)

### 9.1 GPU Timestamps
- Create `GPUQuerySet` with type `"timestamp"`, count 2.
- In compute pass: `writeTimestamp(querySet, queryIndex)` at start and end.
- After submission, resolve query set into a `GPUBuffer`, map to host, read timestamp differences.
- Timestamp period (ns per tick) obtained from `device.querySet.resolveTimestampPeriod`.

### 9.2 WASM Instruction Counting
- Engine must provide an instruction counter (e.g., V8's `--trace-ic` or custom instrumentation).
- Expose counter via syscall: `vm_get_instruction_count() -> u64`.

---

## 10. Example Minimal Guest Code (Rust-like pseudocode)

```rust
// Guest: allocate GPU buffer, dispatch compute, read result
let handle = vm_buffer_create(STORAGE | COPY_DST | COPY_SRC, 4096);
let wgsl = "..." // compute shader
let pipeline = vm_compute_pipeline_create(wgsl.as_ptr(), wgsl.len());
let bind_group = vm_bind_group_create(layout, ...);

vm_command_begin();
vm_command_set_pipeline(pipeline);
vm_command_set_bind_group(0, bind_group, null, 0);
vm_command_dispatch(64, 1, 1);
vm_submit();
vm_wait_fence();

let mut output = [0u32; 1024];
vm_buffer_read(handle, output.as_ptr() as u32, 0, 4096);
```

---

## 11. DREAMengin Integration

### 11.1 Dual Runtime Architecture
The WASM+GPU VM is designed to operate in both runtime regions of DREAMengin:
- **Left Region**: Primary VM for compute-intensive operations
- **Right Region**: Secondary VM for parallel processing or fallback

### 11.2 Bridge Integration
VMs communicate via the `dualRuntimeBridge`:
- Events: `vm:buffer-ready`, `vm:compute-complete`, `vm:error`
- Channels: `compute`, `game`, `lab`, `code`

### 11.3 Resource Sharing
- SharedArrayBuffer backing for WASM linear memory
- GPU buffers can be transferred between VMs via handle passing
- Pipeline cache is shared across all VM instances

---

## Implementation Files

- `/lib/vm/wasmGpuVM.ts` - Core VM implementation
- `/lib/vm/types.ts` - Type definitions
- `/lib/vm/syscalls.ts` - System call ABI
- `/lib/vm/bufferManager.ts` - GPU buffer management
- `/lib/vm/pipelineCache.ts` - Pipeline compilation cache
- `/lib/vm/snapshot.ts` - Serialization system
- `/lib/vm/dualVMCoordinator.ts` - Dual VM orchestration
- `/tests/wasm-gpu-vm.test.ts` - Integration tests
