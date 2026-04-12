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

// ── The 6-Channel Virtual Bus for the Online Economy ──────────────────────────

class DualRuntimeBridge extends EventEmitter {
  private readonly channelState: Map<string, unknown> = new Map();
  private readonly peers: Map<string, PeerState> = new Map();
  private readonly peerListeners: Set<(peers: readonly PeerState[]) => void> = new Set();
  private readonly emissionListeners: Set<(emission: AnyBridgeEmission) => void> = new Set();

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

  // ── Private helpers ────────────────────────────────────────────────────────

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


