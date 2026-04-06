'use client';
/**
 * useDualRuntime — React hook for the Dual Runtime Bridge.
 *
 * Provides a scoped interface to the cross-Engin event bus for a single channel.
 * Automatically cleans up all subscriptions when the component unmounts.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (Daydream pair system).
 * Privacy note: only emit events that represent explicit user-initiated actions.
 * Do NOT emit raw user data across channels — see docs/AXIOMS.md §4 & §5.
 *
 * @example
 * // In StarMakerEngin component:
 * const { emit, on, peers } = useDualRuntime('music');
 *
 * // Subscribe to another Engin's events:
 * on('games', 'games:achievement-unlocked', ({ title }) => {
 *   showToast(`🏆 New achievement: ${title}`);
 * });
 *
 * // Emit to any channel:
 * emit('music', 'music:bpm-changed', { bpm: 128, trackId: 'abc' });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bridge,
  type DualRuntimeChannel,
  type ChannelEventKey,
  type ChannelEventPayload,
  type BridgeEventHandler,
  type UnsubscribeFn,
  type PeerState,
} from './dualRuntimeBridge';

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseDualRuntimeReturn {
  /**
   * Emit an event on any channel.
   *
   * @example
   * emit('music', 'music:bpm-changed', { bpm: 128, trackId: 'abc' });
   */
  emit: <C extends DualRuntimeChannel, K extends ChannelEventKey<C>>(
    channel: C,
    event: K,
    payload: ChannelEventPayload<C, K>,
  ) => void;

  /**
   * Subscribe to an event on any channel.
   * Subscription is auto-cleaned on component unmount.
   *
   * Returns an unsubscribe function if you need to unsubscribe early.
   *
   * @example
   * on('games', 'games:score-submitted', ({ score }) => setScore(score));
   */
  on: <C extends DualRuntimeChannel, K extends ChannelEventKey<C>>(
    channel: C,
    event: K,
    handler: BridgeEventHandler<ChannelEventPayload<C, K>>,
  ) => UnsubscribeFn;

  /**
   * Live peer activity states for all six channels.
   * Shows which Engins currently have active subscribers and when they last emitted.
   */
  peers: readonly PeerState[];

  /**
   * The channel this hook instance was mounted with.
   */
  channel: DualRuntimeChannel;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDualRuntime
 *
 * @param channel - The primary channel for this hook instance (used for
 *   scoping identity — you can still subscribe to other channels via `on`).
 */
export function useDualRuntime(channel: DualRuntimeChannel): UseDualRuntimeReturn {
  // Track all subscriptions created by this hook instance for cleanup
  const unsubscribersRef = useRef<UnsubscribeFn[]>([]);

  // Peers state — refreshes when any event fires on the primary channel
  const [peers, setPeers] = useState<readonly PeerState[]>(() => bridge.getPeers());

  // Refresh peers snapshot from bridge-driven activity updates
  useEffect(() => {
    return bridge.subscribePeerActivity((nextPeers) => {
      setPeers(nextPeers);
    });
  }, []);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      const unsubs = unsubscribersRef.current;
      for (const unsub of unsubs) {
        unsub();
      }
      unsubscribersRef.current = [];
    };
  }, []);

  /**
   * Stable `emit` — wraps bridge.emit with no extra state.
   */
  const emit = useCallback(
    <C extends DualRuntimeChannel, K extends ChannelEventKey<C>>(
      targetChannel: C,
      event: K,
      payload: ChannelEventPayload<C, K>,
    ) => {
      bridge.emit(targetChannel, event, payload);
      // Refresh peers immediately after emitting
      setPeers(bridge.getPeers());
    },
    [],
  );

  /**
   * Stable `on` — registers a subscription and tracks it for auto-cleanup.
   * Returns an early-unsubscribe function.
   */
  const on = useCallback(
    <C extends DualRuntimeChannel, K extends ChannelEventKey<C>>(
      targetChannel: C,
      event: K,
      handler: BridgeEventHandler<ChannelEventPayload<C, K>>,
    ): UnsubscribeFn => {
      const unsub = bridge.subscribe(targetChannel, event, handler);

      // Track for cleanup on unmount
      unsubscribersRef.current.push(unsub);

      // Refresh peers to reflect new subscriber count
      setPeers(bridge.getPeers());

      // Return early-unsubscribe
      return () => {
        unsub();
        // Remove from tracked list
        unsubscribersRef.current = unsubscribersRef.current.filter(
          (fn) => fn !== unsub,
        );
        setPeers(bridge.getPeers());
      };
    },
    [],
  );

  return { emit, on, peers, channel };
}

// ─── Convenience re-exports ───────────────────────────────────────────────────

export type {
  DualRuntimeChannel,
  ChannelEventKey,
  ChannelEventPayload,
  PeerState,
  BridgeEventHandler,
  UnsubscribeFn,
} from './dualRuntimeBridge';
