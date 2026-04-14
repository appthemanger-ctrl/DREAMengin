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
  | 'create';

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

  constructor() {
    super();
    this.setMaxListeners(100);
    void this.initWasm();
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

      const wasmBinary = await fetch(BUS_WASM_URL).then((r) => r.arrayBuffer());

      const { instance } = (await WebAssembly.instantiate(wasmBinary, { env: { memory } })) as WebAssembly.WebAssemblyInstantiatedSource;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeNumber = (heapBase as any) as number | undefined;
    return typeof maybeNumber === 'number' ? maybeNumber : null;
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
    handler: (payload: Record<string, unknown>) => void,
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
  subscribePeerActivity(callback: (peers: readonly PeerState[]) => void): UnsubscribeFn {
    this.peerListeners.add(callback);
    callback(this.getPeers());
    return () => { this.peerListeners.delete(callback); };
  }

  /** Return a snapshot of all peer states. */
  getPeers(): PeerState[] {
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
}

export const enginBridge = new DualRuntimeBridge();

/** Canonical alias used throughout the codebase. */
export const bridge = enginBridge;
