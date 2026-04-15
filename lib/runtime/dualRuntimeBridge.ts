'use client';

import { EventEmitter } from 'events';

// ── Channel types ──────────────────────────────────────────────────────────────

export type DualRuntimeChannel =
  | 'code'
  | 'game'
  | 'games'
  | 'music'
  | 'lab'
  | 'brand'
  | 'content'
  | 'create'
  | 'compute';

// ── VM region ─────────────────────────────────────────────────────────────────
export type VMRegion = 'top' | 'bottom';

// ── Quantum compute result ────────────────────────────────────────────────────
export interface QuantumComputeResult {
  algorithm: string;
  ansatz: string;
  numQubits: number;
  probabilities: number[];
  topBitstring: string;
  topProbability: number;
  selectedAssets: boolean[];
  expectationValue: number;
  computedAt: number;
}

// ── VM workload ───────────────────────────────────────────────────────────────
export interface VMWorkload {
  id: string;
  region: VMRegion;
  wasmBinary: BufferSource;
  channel: DualRuntimeChannel;
  priority: number;
}

// ── Quantum circuit compute engine (inline) ───────────────────────────────────
// Pure complex-number state vector simulation; no canvas, no components.
// Dispatched automatically on bridge.emit('lab', 'quantum:run', payload).

type _C = [number, number];
type _Gate = [_C, _C, _C, _C];
type _SV = _C[];

const _IS2 = 1 / Math.SQRT2;
const _GATE_H: _Gate = [[_IS2,0],[_IS2,0],[_IS2,0],[-_IS2,0]];

function _gateRx(t: number): _Gate { const c=Math.cos(t/2),s=Math.sin(t/2); return [[c,0],[0,-s],[0,-s],[c,0]]; }
function _gateRy(t: number): _Gate { const c=Math.cos(t/2),s=Math.sin(t/2); return [[c,0],[-s,0],[s,0],[c,0]]; }
function _gateRz(t: number): _Gate { const c=Math.cos(t/2),s=Math.sin(t/2); return [[c,-s],[0,0],[0,0],[c,s]]; }
function _groundState(n: number): _SV { const sv = Array.from({length: 1 << n}, (): _C => [0, 0]); sv[0] = [1, 0]; return sv as _SV; }
function _cmul([r1,i1]: _C,[r2,i2]: _C): _C { return [r1*r2-i1*i2, r1*i2+i1*r2]; }
function _cadd([r1,i1]: _C,[r2,i2]: _C): _C { return [r1+r2, i1+i2]; }

function _applyGate1(sv: _SV, n: number, q: number, u: _Gate): _SV {
  const next = sv.slice();
  const bit = 1 << (n - 1 - q);
  for (let i = 0; i < sv.length; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const a = sv[i]!, b = sv[j]!;
    next[i] = _cadd(_cmul(u[0], a), _cmul(u[1], b));
    next[j] = _cadd(_cmul(u[2], a), _cmul(u[3], b));
  }
  return next;
}

function _applyCNOT(sv: _SV, n: number, ctrl: number, tgt: number): _SV {
  const next = sv.slice();
  const cBit = 1 << (n - 1 - ctrl), tBit = 1 << (n - 1 - tgt);
  for (let i = 0; i < sv.length; i++) {
    if ((i & cBit) !== 0 && (i & tBit) === 0) { const j = i | tBit; next[i] = sv[j]!; next[j] = sv[i]!; }
  }
  return next;
}

const _RETURNS = [0.12, 0.09, 0.15], _SIGMA = [0.20, 0.15, 0.25];
const _CORR    = [[1, 0.3, 0.1], [0.3, 1, 0.2], [0.1, 0.2, 1]];

function _quboCost(bits: boolean[]): number {
  let c = 0;
  bits.forEach((b, i) => { if (b) c -= _RETURNS[i] ?? 0.1; });
  for (let i = 0; i < bits.length; i++)
    for (let j = i + 1; j < bits.length; j++)
      if (bits[i] && bits[j])
        c += 0.5 * (_SIGMA[i] ?? 0.2) * (_SIGMA[j] ?? 0.2) * ((_CORR[i] ?? [])[j] ?? 0.2);
  return c;
}

type _Op = { kind: string; q?: number; ctrl?: number; tgt?: number; theta?: number };

function _buildCircuit(n: number, algo: string, ansatz: string): _Op[] {
  const ops: _Op[] = [];
  if (algo === 'qaoa') {
    const g = Math.PI * 0.4, b = Math.PI * 0.35;
    for (let q = 0; q < n; q++) ops.push({ kind: 'H', q });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rz', q, theta: g });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rx', q, theta: 2 * b });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: g / 2 });
  } else if (ansatz === 'efficient_su2') {
    const p = [0.9, 0.7, 1.1, 0.6, 0.8, 0.5, 1.2, 1.0, 0.7, 0.4, 0.8, 1.0];
    for (let q = 0; q < n; q++) ops.push({ kind: 'H', q });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: p[q] ?? Math.PI / 4 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rz', q, theta: p[q + n] ?? Math.PI / 4 });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: p[q + 2 * n] ?? Math.PI / 4 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Rz', q, theta: p[q + 3 * n] ?? Math.PI / 4 });
  } else {
    const t1 = [Math.PI / 3, Math.PI / 4, Math.PI / 5], t2 = [Math.PI / 6, Math.PI / 4, Math.PI / 3];
    for (let q = 0; q < n; q++) ops.push({ kind: 'H', q });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: t1[q] ?? Math.PI / 4 });
    for (let q = 0; q < n - 1; q++) ops.push({ kind: 'CX', ctrl: q, tgt: q + 1 });
    for (let q = 0; q < n; q++) ops.push({ kind: 'Ry', q, theta: t2[q] ?? Math.PI / 4 });
  }
  return ops;
}

function _runCircuit(numQubits: number, algo: string, ansatz: string): QuantumComputeResult {
  let sv = _groundState(numQubits);
  for (const op of _buildCircuit(numQubits, algo, ansatz)) {
    if      (op.kind === 'H'  && op.q    != null)                    sv = _applyGate1(sv, numQubits, op.q, _GATE_H);
    else if (op.kind === 'Rx' && op.q    != null && op.theta != null) sv = _applyGate1(sv, numQubits, op.q, _gateRx(op.theta));
    else if (op.kind === 'Ry' && op.q    != null && op.theta != null) sv = _applyGate1(sv, numQubits, op.q, _gateRy(op.theta));
    else if (op.kind === 'Rz' && op.q    != null && op.theta != null) sv = _applyGate1(sv, numQubits, op.q, _gateRz(op.theta));
    else if (op.kind === 'CX' && op.ctrl != null && op.tgt   != null) sv = _applyCNOT(sv, numQubits, op.ctrl, op.tgt);
  }
  const ps = sv.map(([r, i]) => r * r + i * i);
  const topIdx = ps.reduce((best, v, i) => (v > ps[best] ? i : best), 0);
  const topBits = Array.from({ length: numQubits }, (_, k) => Boolean((topIdx >> (numQubits - 1 - k)) & 1));
  const ev = ps.reduce((sum, prob, i) => {
    const bits = Array.from({ length: numQubits }, (_, k) => Boolean((i >> (numQubits - 1 - k)) & 1));
    return sum + prob * _quboCost(bits);
  }, 0);
  return {
    algorithm: algo, ansatz, numQubits, probabilities: ps,
    topBitstring: topBits.map(b => b ? '1' : '0').join(''),
    topProbability: ps[topIdx] ?? 0, selectedAssets: topBits,
    expectationValue: ev, computedAt: Date.now(),
  };
}

// ── Inter-VM ring buffer constants ────────────────────────────────────────────
const VM_QUEUE_CAPACITY = 256;
const VM_MESSAGE_SIZE   = 1024;
const VM_QUEUE_BUF_SIZE = VM_QUEUE_CAPACITY * VM_MESSAGE_SIZE + 8; // +8 for producer/consumer indices

// ── Event schema types (intentionally loose — channels define their own events) ─

export type ChannelEventKey<_C extends DualRuntimeChannel> = string;
export type ChannelEventPayload<_C extends DualRuntimeChannel, _K extends string> = Record<string, unknown>;
export type BridgeEventHandler<P = Record<string, unknown>> = (payload: P) => void;
export type UnsubscribeFn = () => void;

// ── Peer state ────────────────────────────────────────────────────────────────

export interface PeerState {
  channel: string;
  subscriberCount: number;
  lastActivityAt: number | null;
}

// ── Emission record ───────────────────────────────────────────────────────────

export interface AnyBridgeEmission {
  channel: string;
  event: string;
  payload: Record<string, unknown>;
  emittedAt: number;
}

// ── Durable delivery types ────────────────────────────────────────────────────

/** Lifecycle of a durable emission. */
export type AckStatus = 'pending' | 'acked' | 'dropped';

/**
 * An emission that requires delivery acknowledgement.
 * Stored in the bridge's durable queue until acked or explicitly dropped.
 */
export interface QueuedEmission extends AnyBridgeEmission {
  /** Unique ID for this emission — returned by emitDurable. */
  id: string;
  status: AckStatus;
  enqueuedAt: number;
  /** Timestamp at which ack() was called, if status is 'acked'. */
  ackedAt?: number;
  /** Time-to-live in ms. After this the entry is eligible for cleanup. */
  ttlMs: number;
}

// ── Shared memory bus constants ───────────────────────────────────────────────

const ENTRY_WORDS = 4; // channel:event, payloadPtr, payloadLen, reserved
const ENTRY_BYTES = ENTRY_WORDS * 4;
const PAYLOAD_PREFIX_BYTES = 4; // length prefix stored before JSON payload
const DEFAULT_ALLOC_START = 1 * 1024 * 1024; // 1 MB offset to avoid clobbering static data
const POLL_INTERVAL_MS = 0; // as fast as possible; the timer is coalesced by the browser/event loop
const BUS_WASM_URL = new URL('../bus.wasm', import.meta.url);

// ── Improvement 31: durable queue max size ────────────────────────────────────
/** Maximum number of entries kept in the durable queue. Oldest dropped entries
 *  are purged first when the limit is exceeded to prevent unbounded memory growth. */
const MAX_DURABLE_QUEUE_SIZE = 200;

// ── Improvement 35: emission counter ─────────────────────────────────────────
/** Monotonically increasing count of all emissions (emit + emitDurable). */
let _totalEmissions = 0;
/** Run eviction every N emissions to avoid the per-emit overhead on busy buses. */
const EVICT_EVERY_N = 50;

type WasmExports = {
  enqueue: (channel: number, event: number, ptr: number, len: number) => number;
  dequeue: (outPtr: number) => number;
  reset?: () => void;
  __heap_base?: WebAssembly.Global;
};

class DualRuntimeBridge extends EventEmitter {
  private readonly channelState: Map<string, unknown> = new Map();
  private readonly peers: Map<string, PeerState> = new Map();
  private readonly peerListeners: Set<(peers: readonly PeerState[]) => void> = new Set();
  private readonly emissionListeners: Set<(emission: AnyBridgeEmission) => void> = new Set();
  /** Durable queue — keyed by emission id. */
  private readonly durableQueue: Map<string, QueuedEmission> = new Map();

  private memory: WebAssembly.Memory | null = null;
  private wasm: WasmExports | null = null;
  private busOnline = false;
  private allocPtr = DEFAULT_ALLOC_START;
  private entryPtr = 0;
  private entryView: Uint32Array | null = null;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  // ── Dual VM upgrade ───────────────────────────────────────────────────────
  private _vmTop:    unknown = null;
  private _vmBottom: unknown = null;
  private _vmInterQueue: {
    buffer: SharedArrayBuffer;
    producerIndex: Int32Array;
    consumerIndex: Int32Array;
  } | null = null;
  private readonly _vmEventChannels = new Map<string, { buffer: SharedArrayBuffer; view: Int32Array }>();
  private readonly _vmActiveWorkloads = new Map<string, VMRegion>();

  constructor() {
    super();
    this.setMaxListeners(100);
    void this.initWasm();
    // ── Quantum compute handler ───────────────────────────────────────────
    // bridge.emit('lab', 'quantum:run', {algorithm, ansatz, numQubits?})
    // → runs QAOA/VQE state-vector simulation inline
    // → emits 'lab:quantum:result' which dreamOSBus auto-ingests as lab-result
    this.subscribe('lab', 'quantum:run', (payload) => {
      const algo      = (payload['algorithm']  as string) ?? 'vqe';
      const ansatz    = (payload['ansatz']     as string) ?? 'real_amplitudes';
      const numQubits = (payload['numQubits']  as number) ?? 3;
      const result    = _runCircuit(numQubits, algo, ansatz);
      this.emit('lab', 'quantum:result', result as unknown as Record<string, unknown>);
      // Write result to inter-VM ring buffer if available so both VMs see it
      if (this._vmInterQueue) {
        this._writeInterVMMessage(new TextEncoder().encode(JSON.stringify(result)));
      }
    });
  }

  // ── WASM bridge initialisation ─────────────────────────────────────────----

  private async initWasm(): Promise<void> {
    if (this.busOnline) return;
    try {
      const memory = new WebAssembly.Memory({
        initial: 8, // 8 pages = 512 KB (must satisfy the module's minimum of 4)
        maximum: 64, // align with the compiled maximum
        shared: true,
      });

      const wasmBinary = await this.loadWasmBinary();
      const imports = {
        env: {
          memory,
          // AssemblyScript expects abort to exist; no-op for our use-case.
          abort: () => {},
        },
      };

      const { instance } = (await WebAssembly.instantiate(wasmBinary, imports)) as WebAssembly.WebAssemblyInstantiatedSource;

      this.memory = memory;
      this.wasm = instance.exports as unknown as WasmExports;
      this.busOnline = typeof this.wasm.enqueue === 'function' && typeof this.wasm.dequeue === 'function';

      if (!this.busOnline) {
        this.memory = null;
        this.wasm = null;
        return;
      }

      this.allocPtr = this.readHeapBase() ?? DEFAULT_ALLOC_START;
      this.entryPtr = this.allocate(ENTRY_BYTES);
      this.entryView = this.memory ? new Uint32Array(this.memory.buffer, this.entryPtr, ENTRY_WORDS) : null;

      this.startPolling();
    } catch (err) {
      console.warn('dualRuntimeBridge: WASM bus unavailable, falling back to in-memory queue', err);
      this.memory = null;
      this.wasm = null;
      this.busOnline = false;
    }
  }

  private readHeapBase(): number | null {
    if (!this.wasm) return null;
    const heapBase = this.wasm.__heap_base;
    if (heapBase && typeof heapBase.value === 'number') {
      return heapBase.value;
    }
    // AssemblyScript sometimes exposes __heap_base as a number instead of a WebAssembly.Global
    const maybeNumber = (heapBase as any) as number | undefined;
    return typeof maybeNumber === 'number' ? maybeNumber : null;
  }

  private async loadWasmBinary(): Promise<ArrayBuffer> {
    // Browser / worker path: fetch the emitted asset URL.
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      return fetch(BUS_WASM_URL).then((r) => r.arrayBuffer());
    }

    // Node / Vitest path: read directly from the filesystem to avoid file:// fetch limitations.
    const [{ readFile }, { fileURLToPath }] = await Promise.all([
      // webpackIgnore: true — Node built-ins; bundlers must skip static analysis of these imports.
      import(/* webpackIgnore: true */ 'fs/promises'),
      import(/* webpackIgnore: true */ 'url'),
    ]);
    const buf = await readFile(fileURLToPath(BUS_WASM_URL.toString()));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }

  private startPolling() {
    if (!this.busOnline || this.pollHandle) return;
    this.pollHandle = setInterval(() => {
      this.drainQueue();
    }, POLL_INTERVAL_MS);
  }

  private drainQueue() {
    if (!this.busOnline || !this.wasm || !this.entryView) return;
    while (this.wasm.dequeue(this.entryPtr)) {
      const payloadPtr = this.entryView[1];
      const payloadLen = this.entryView[2];
      const envelope = this.readEnvelope(payloadPtr, payloadLen);
      if (!envelope) continue;

      this.dispatchLocal(envelope.channel, envelope.event, envelope.payload);
    }
  }

  private readEnvelope(ptr: number, declaredLen: number): { channel: string; event: string; payload: Record<string, unknown> } | null {
    if (!this.memory) return null;
    const lenView = new Uint32Array(this.memory.buffer, ptr, 1);
    const storedLen = lenView[0];
    const byteLength = declaredLen || storedLen;
    if (byteLength <= 0) return null;

    const payloadBytes = new Uint8Array(this.memory.buffer, ptr + PAYLOAD_PREFIX_BYTES, byteLength);
    try {
      return JSON.parse(this.decoder.decode(payloadBytes));
    } catch {
      return null;
    }
  }

  private allocate(size: number): number {
    if (!this.memory) return 0;
    const aligned = (this.allocPtr + 7) & ~7;
    const next = aligned + size;
    const needed = next - this.memory.buffer.byteLength;
    if (needed > 0) {
      const pages = Math.ceil(needed / 65536);
      try {
        this.memory.grow(pages);
      } catch {
        return 0;
      }
    }
    this.allocPtr = next;
    return aligned;
  }

  private enqueueEnvelope(channel: string, event: string, payload: Record<string, unknown>): boolean {
    if (!this.busOnline || !this.wasm || !this.memory) {
      this.dispatchLocal(channel, event, payload);
      return true;
    }

    const envelope = { channel, event, payload };
    const encoded = this.encoder.encode(JSON.stringify(envelope));
    const totalSize = PAYLOAD_PREFIX_BYTES + encoded.length;
    const ptr = this.allocate(totalSize);
    if (ptr === 0) {
      this.dispatchLocal(channel, event, payload);
      return true;
    }

    const lenView = new Uint32Array(this.memory.buffer, ptr, 1);
    lenView[0] = encoded.length;
    new Uint8Array(this.memory.buffer).set(encoded, ptr + PAYLOAD_PREFIX_BYTES);

    const packedChannel = this.hash(channel);
    const packedEvent = this.hash(event);
    const ok = this.wasm.enqueue(packedChannel, packedEvent, ptr, encoded.length);

    if (!ok) {
      this.dispatchLocal(channel, event, payload);
      return false;
    }

    // Drain immediately for same-thread delivery; poller covers cross-thread delivery.
    this.drainQueue();
    return true;
  }

  // ── Channel emission ───────────────────────────────────────────────────────

  /** Emit an event on a named channel. Primary public API for cross-Engin events. */
  emit(channel: string, event: string, payload: Record<string, unknown>): boolean {
    this.enqueueEnvelope(channel, event, payload);
    return true;
  }

  /** Legacy: emit a bulk update to a channel (used by connectors & adapters). */
  emitToChannel(channel: string, data: unknown) {
    this.channelState.set(channel, data);
    super.emit(`channel:${channel}`, data);
    super.emit('global_update', { channel, data });
    this._touchPeer(channel);
  }

  getChannelState(channel: string) {
    return this.channelState.get(channel) ?? null;
  }

  // ── Event subscriptions ────────────────────────────────────────────────────

  /** Subscribe to a specific channel:event. Returns an unsubscribe function. */
  subscribe(
    channel: string,
    event: string,
    handler: (payload: Record<string, any>) => void,
  ): UnsubscribeFn {
    const key = `${channel}:${event}`;
    this.on(key, handler as BridgeEventHandler);
    this._incrementPeerSubscribers(channel);
    return () => {
      this.off(key, handler as BridgeEventHandler);
      this._decrementPeerSubscribers(channel);
    };
  }

  // ── Peer activity ──────────────────────────────────────────────────────────

  /** Subscribe to peer-activity changes. Returns an unsubscribe function. */
  subscribePeerActivity(callback: (peers: ReadonlyArray<PeerState>) => void): UnsubscribeFn {
    this.peerListeners.add(callback);
    callback(this.getPeers());
    return () => { this.peerListeners.delete(callback); };
  }

  /** Return a snapshot of all peer states. */
  getPeers(): ReadonlyArray<PeerState> {
    return Array.from(this.peers.values());
  }

  // ── Emission activity ──────────────────────────────────────────────────────

  /** Subscribe to all bridge emissions (any channel/event). Used by dreamOSBus. */
  subscribeEventActivity(callback: (emission: AnyBridgeEmission) => void): UnsubscribeFn {
    this.emissionListeners.add(callback);
    return () => { this.emissionListeners.delete(callback); };
  }

  // ── Durable delivery ──────────────────────────────────────────────────────

  /**
   * Emit a cross-Engin event that requires delivery acknowledgement.
   *
   * The event is emitted immediately (same as `emit`) **and** stored in the
   * durable queue with status 'pending'.  Call `ack(id)` once the subscriber
   * has processed it.  Use `replayPending()` to re-deliver after a subscriber
   * comes back online.
   *
   * @param channel  Target channel (e.g. 'music').
   * @param event    Event name (e.g. 'stem-ready').
   * @param payload  Serialisable event payload.
   * @param ttlMs    Time-to-live in ms before the entry is dropped (default 60 s).
   * @returns        The unique emission ID — pass this to `ack()`.
   */
  emitDurable(
    channel: string,
    event: string,
    payload: Record<string, unknown>,
    ttlMs = 60_000,
  ): string {
    const id = typeof crypto !== 'undefined' && (crypto as Crypto).randomUUID
      ? (crypto as Crypto).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = Date.now();

    const queued: QueuedEmission = {
      id,
      channel,
      event,
      payload,
      emittedAt: now,
      enqueuedAt: now,
      status: 'pending',
      ttlMs,
    };

    this.durableQueue.set(id, queued);
    this.emit(channel, event, payload);
    this._evictExpired();
    this._trimQueue();
    return id;
  }

  /**
   * Acknowledge delivery of a durable emission.
   * The queue entry transitions from 'pending' → 'acked'.
   */
  ack(id: string): void {
    const entry = this.durableQueue.get(id);
    if (!entry || entry.status !== 'pending') return;
    this.durableQueue.set(id, { ...entry, status: 'acked', ackedAt: Date.now() });
  }

  /**
   * Explicitly drop a pending durable emission by ID.
   * Useful when the caller knows the receiver will never come online.
   * No-op when the ID is unknown or the entry is already acked/dropped.
   */
  drop(id: string): void {
    const entry = this.durableQueue.get(id);
    if (!entry || entry.status !== 'pending') return;
    this.durableQueue.set(id, { ...entry, status: 'dropped' });
  }

  /**
   * Re-emit all 'pending' durable events, optionally filtered to one channel.
   * Call this when an Engin comes (back) online to receive events it missed.
   */
  replayPending(channel?: string): void {
    this._evictExpired();
    for (const entry of this.durableQueue.values()) {
      if (entry.status !== 'pending') continue;
      if (channel !== undefined && entry.channel !== channel) continue;
      this.emit(entry.channel, entry.event, entry.payload);
    }
  }

  /** Return a snapshot of the durable queue (all statuses). */
  getDurableQueue(): readonly QueuedEmission[] {
    return Array.from(this.durableQueue.values());
  }

  // ── Improvement 34: getStats ──────────────────────────────────────────────

  /**
   * Return a point-in-time snapshot of bridge statistics.
   * Useful for health-check endpoints and performance dashboards.
   */
  getStats(): {
    totalEmissions: number;
    queueDepth: number;
    pendingCount: number;
    ackedCount: number;
    droppedCount: number;
    peerCount: number;
    subscriberCount: number;
  } {
    let pending = 0, acked = 0, dropped = 0;
    for (const e of this.durableQueue.values()) {
      if (e.status === 'pending') pending++;
      else if (e.status === 'acked') acked++;
      else dropped++;
    }
    const subscriberCount = Array.from(this.peers.values())
      .reduce((sum, p) => sum + p.subscriberCount, 0);
    return {
      totalEmissions: _totalEmissions,
      queueDepth: this.durableQueue.size,
      pendingCount: pending,
      ackedCount: acked,
      droppedCount: dropped,
      peerCount: this.peers.size,
      subscriberCount,
    };
  }

  // ── Improvement 36: hasSubscribers ───────────────────────────────────────

  /**
   * Returns true when at least one subscriber is active on the given channel.
   * Avoids firing expensive computations when no one is listening.
   */
  hasSubscribers(channel: string): boolean {
    return (this.peers.get(channel)?.subscriberCount ?? 0) > 0;
  }

  // ── Dual VM API ───────────────────────────────────────────────────────────

  /**
   * Initialize the top and bottom WASM+GPU VMs plus the inter-VM
   * SharedArrayBuffer ring buffer.  Dynamically imports WasmGpuVM so
   * this module stays loadable in test/SSR environments without WebGPU.
   */
  async initVMs(config: { enableInterVMCommunication?: boolean } = {}): Promise<void> {
    if (this._vmTop && this._vmBottom) return;
    try {
      const { WasmGpuVM } = await import('@/lib/vm/wasmGpuVM');
      this._vmTop    = await WasmGpuVM.create({ id: 'vm-top' });
      this._vmBottom = await WasmGpuVM.create({ id: 'vm-bottom' });
      if (config.enableInterVMCommunication !== false) {
        const buffer = new SharedArrayBuffer(VM_QUEUE_BUF_SIZE);
        const producerIndex = new Int32Array(buffer, 0, 1);
        const consumerIndex = new Int32Array(buffer, 4, 1);
        Atomics.store(producerIndex, 0, 0);
        Atomics.store(consumerIndex, 0, 0);
        this._vmInterQueue = { buffer, producerIndex, consumerIndex };
      }
      // Workload dispatch: compute:vm:dispatch-workload → submitVMWorkload
      this.subscribe('compute', 'vm:dispatch-workload', (p) => {
        void this._handleVMWorkload(p);
      });
      this.emit('compute', 'vm:initialized', {
        topVMId: 'vm-top', bottomVMId: 'vm-bottom',
        interVMEnabled: config.enableInterVMCommunication !== false,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[DualRuntimeBridge] VM init failed (WebGPU unavailable?):', err);
    }
  }

  /** Destroy both VMs and release the inter-VM ring buffer. */
  destroyVMs(): void {
    (this._vmTop    as { destroy?(): void } | null)?.destroy?.();
    (this._vmBottom as { destroy?(): void } | null)?.destroy?.();
    this._vmTop    = null;
    this._vmBottom = null;
    this._vmInterQueue = null;
    this._vmEventChannels.clear();
    this._vmActiveWorkloads.clear();
  }

  /**
   * Send a raw byte message from one VM to the other through the shared
   * ring buffer.  Returns true when the message was enqueued.
   */
  sendInterVMMessage(from: VMRegion, to: VMRegion, message: Uint8Array): boolean {
    if (!this._vmInterQueue) return false;
    const written = this._writeInterVMMessage(message);
    if (written) {
      this.emit('compute', 'vm:inter-vm-message', { from, to, size: message.byteLength, timestamp: Date.now() });
    }
    return written;
  }

  /**
   * Submit a WASM workload to the top or bottom VM.
   * The workload result is emitted on the given channel.
   */
  async submitVMWorkload(workload: VMWorkload): Promise<void> {
    const vm = workload.region === 'top' ? this._vmTop : this._vmBottom;
    if (!vm) throw new Error(`VM not initialized: ${workload.region}`);
    this._vmActiveWorkloads.set(workload.id, workload.region);
    await (vm as { loadWasm(b: BufferSource): Promise<void> }).loadWasm(workload.wasmBinary);
    this.emit(workload.channel, 'vm:workload-submitted', {
      workloadId: workload.id, region: workload.region, timestamp: Date.now(),
    });
  }

  /**
   * Return VM stats (counters, active workloads) or null if VMs are not
   * yet initialized.
   */
  getVMStats(): {
    top:    Record<string, unknown> | null;
    bottom: Record<string, unknown> | null;
    activeWorkloads: { id: string; region: VMRegion }[];
  } | null {
    if (!this._vmTop && !this._vmBottom) return null;
    return {
      top:    this._vmTop    ? (this._vmTop    as { getStats(): Record<string, unknown> }).getStats() : null,
      bottom: this._vmBottom ? (this._vmBottom as { getStats(): Record<string, unknown> }).getStats() : null,
      activeWorkloads: Array.from(this._vmActiveWorkloads.entries()).map(([id, region]) => ({ id, region })),
    };
  }

  // ── Test / teardown helpers ────────────────────────────────────────────────

  /**
   * Remove all listeners, peers, channel state, and durable queue entries.
   * Intended for test teardown only — do not call in production code.
   */
  clearAll(): void {
    this.removeAllListeners();
    this.channelState.clear();
    this.peers.clear();
    this.peerListeners.clear();
    this.emissionListeners.clear();
    this.durableQueue.clear();
    _totalEmissions = 0;
    if (this.wasm?.reset) this.wasm.reset();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Remove durable queue entries that have exceeded their TTL. */
  private _evictExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.durableQueue) {
      if (entry.status === 'pending' && now - entry.enqueuedAt > entry.ttlMs) {
        this.durableQueue.set(id, { ...entry, status: 'dropped' });
      }
    }
  }

  /**
   * Trim the durable queue to MAX_DURABLE_QUEUE_SIZE by removing the oldest
   * non-pending (dropped/acked) entries first, then oldest pending entries.
   */
  private _trimQueue(): void {
    if (this.durableQueue.size <= MAX_DURABLE_QUEUE_SIZE) return;
    const entries = Array.from(this.durableQueue.entries())
      .sort(([, a], [, b]) => a.enqueuedAt - b.enqueuedAt);
    // Remove non-pending first
    for (const [id, entry] of entries) {
      if (this.durableQueue.size <= MAX_DURABLE_QUEUE_SIZE) break;
      if (entry.status !== 'pending') this.durableQueue.delete(id);
    }
    // If still over limit, remove oldest pending
    for (const [id] of entries) {
      if (this.durableQueue.size <= MAX_DURABLE_QUEUE_SIZE) break;
      this.durableQueue.delete(id);
    }
  }

  private _touchPeer(channel: string) {
    const existing = this.peers.get(channel);
    this.peers.set(channel, {
      channel,
      subscriberCount: existing?.subscriberCount ?? 0,
      lastActivityAt: Date.now(),
    });
    this._notifyPeerListeners();
  }

  private _incrementPeerSubscribers(channel: string) {
    const existing = this.peers.get(channel);
    this.peers.set(channel, {
      channel,
      subscriberCount: (existing?.subscriberCount ?? 0) + 1,
      lastActivityAt: existing?.lastActivityAt ?? null,
    });
    this._notifyPeerListeners();
  }

  private _decrementPeerSubscribers(channel: string) {
    const existing = this.peers.get(channel);
    if (!existing) return;
    this.peers.set(channel, {
      ...existing,
      subscriberCount: Math.max(0, existing.subscriberCount - 1),
    });
    this._notifyPeerListeners();
  }

  private _notifyPeerListeners() {
    const snapshot = this.getPeers();
    for (const listener of this.peerListeners) {
      listener(snapshot);
    }
  }

  private _notifyEmissionListeners(emission: AnyBridgeEmission) {
    for (const listener of this.emissionListeners) {
      listener(emission);
    }
  }

  private dispatchLocal(channel: string, event: string, payload: Record<string, unknown>) {
    const key = `${channel}:${event}`;
    const ts = Date.now();
    this.channelState.set(channel, payload);
    super.emit(key, payload);
    this._touchPeer(channel);
    this._notifyEmissionListeners({ channel, event, payload, emittedAt: ts });
    _totalEmissions++;
    if (_totalEmissions % EVICT_EVERY_N === 0) this._evictExpired();
  }

  private hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
    return h >>> 0;
  }

  /** Write a byte message into the inter-VM ring buffer. */
  private _writeInterVMMessage(message: Uint8Array): boolean {
    if (!this._vmInterQueue) return false;
    const { buffer, producerIndex, consumerIndex } = this._vmInterQueue;
    const prod = Atomics.load(producerIndex, 0);
    const cons = Atomics.load(consumerIndex, 0);
    if (prod - cons >= VM_QUEUE_CAPACITY) return false;
    const slot   = prod % VM_QUEUE_CAPACITY;
    const offset = slot * VM_MESSAGE_SIZE;
    const view   = new Uint8Array(buffer, offset, VM_MESSAGE_SIZE);
    view.fill(0);
    view.set(message.subarray(0, VM_MESSAGE_SIZE));
    Atomics.add(producerIndex, 0, 1);
    Atomics.notify(consumerIndex, 0, 1);
    return true;
  }

  /** Internal handler for compute:vm:dispatch-workload bridge events. */
  private async _handleVMWorkload(payload: Record<string, unknown>): Promise<void> {
    const { workloadId, region, wasmBinary, channel, priority } = payload as {
      workloadId: string; region: VMRegion; wasmBinary: ArrayBuffer;
      channel: DualRuntimeChannel; priority: number;
    };
    try {
      await this.submitVMWorkload({ id: workloadId, region, wasmBinary, channel, priority });
    } catch (err) {
      this.emit(channel, 'vm:error', { workloadId, error: String(err) });
    }
  }
}

export const enginBridge = new DualRuntimeBridge();

/** Canonical alias used throughout the codebase. */
export const bridge = enginBridge;
