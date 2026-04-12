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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ChannelEventKey<_C extends DualRuntimeChannel> = string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// ── The 6-Channel Virtual Bus for the Online Economy ──────────────────────────

// ── Improvement 31: durable queue max size ────────────────────────────────────
/** Maximum number of entries kept in the durable queue. Oldest dropped entries
 *  are purged first when the limit is exceeded to prevent unbounded memory growth. */
const MAX_DURABLE_QUEUE_SIZE = 200;

// ── Improvement 35: emission counter ─────────────────────────────────────────
/** Monotonically increasing count of all emissions (emit + emitDurable). */
let _totalEmissions = 0;
/** Run eviction every N emissions to avoid the per-emit overhead on busy buses. */
const EVICT_EVERY_N = 50;

class DualRuntimeBridge extends EventEmitter {
  private readonly channelState: Map<string, unknown> = new Map();
  private readonly peers: Map<string, PeerState> = new Map();
  private readonly peerListeners: Set<(peers: readonly PeerState[]) => void> = new Set();
  private readonly emissionListeners: Set<(emission: AnyBridgeEmission) => void> = new Set();
  /** Durable queue — keyed by emission id. */
  private readonly durableQueue: Map<string, QueuedEmission> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  // ── Channel emission ───────────────────────────────────────────────────────

  /** Emit an event on a named channel. Primary public API for cross-Engin events. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(channel: string, event: string, payload: Record<string, any>): boolean {
    const key = `${channel}:${event}`;
    const ts = Date.now();
    this.channelState.set(channel, payload);
    super.emit(key, payload);
    this._touchPeer(channel);
    this._notifyEmissionListeners({ channel, event, payload, emittedAt: ts });
    _totalEmissions++;
    // ── Improvement 36: throttled eviction ──────────────────────────────────
    if (_totalEmissions % EVICT_EVERY_N === 0) this._evictExpired();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (payload: Record<string, any>) => void,
  ): UnsubscribeFn {
    const key = `${channel}:${event}`;
    this.on(key, handler);
    this._incrementPeerSubscribers(channel);
    return () => {
      this.off(key, handler);
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
  getPeers(): readonly PeerState[] {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Record<string, any>,
    ttlMs = 60_000,
  ): string {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
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
    // ── Improvement 31: enforce max queue size ──────────────────────────────
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

  // ── Improvement 35: drop(id) ─────────────────────────────────────────────

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
}

export const enginBridge = new DualRuntimeBridge();

/** Canonical alias used throughout the codebase. */
export const bridge = enginBridge;


