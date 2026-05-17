'use client';

/**
 * lib/runtime/useSharedEnginChannel.ts — Pass 5
 *
 * Shared Dream Wiring — React hook that bridges a RuntimeChannel to an
 * Engin's component tree.
 *
 * An Engin's component tree is never forked on solo vs co-op (guardrail #1
 * from COOP_AND_SOLO_ROADMAP.md). This hook provides a transparent interface:
 *   - Solo Engins get a LocalChannel (zero latency, in-process).
 *   - Co-op Engins get a RealtimeChannel (Supabase Realtime broadcast).
 *
 * The hook wires the channel to the Engin's existing SharedDreamProvider
 * by proxying edit/cursor events through the same payload shape the provider
 * already understands.
 *
 * Usage (inside an Engin component):
 *   const { channel, publish, subscribe, isConnected, peers } = useSharedEnginChannel({
 *     enginName: 'StarMakerEngin',
 *     instanceId: myInstanceId,
 *     mode: 'solo', // or 'coop'
 *   });
 *
 * Architecture: docs/ARCHITECTURE.md §5 (Pass 5 — Shared Dream wiring).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLocalChannel, type RuntimeChannel, type RuntimeChannelEvent } from '@/lib/runtime/runtimeChannel';
import { buildInstanceKey, promoteInstanceToRealtime, useInstanceManager } from '@/lib/runtime/instanceManager';
import type { EnginName } from '@/lib/runtime/instanceManager';
import type { RuntimeId } from '@/types/module-manifest';

// -- Types ---------------------------------------------------------------------

export interface SharedEnginChannelOptions {
  enginName: EnginName;
  instanceId: string;
  region?: RuntimeId;
  /**
   * Channel mode.
   * - 'solo'  → uses a LocalChannel; zero network traffic.
   * - 'coop'  → uses a RealtimeChannel (caller must call promoteToCoOp with it).
   */
  mode?: 'solo' | 'coop';
}

export interface SharedEnginChannelResult<T extends RuntimeChannelEvent = RuntimeChannelEvent> {
  /** The underlying RuntimeChannel for this Engin instance. */
  channel: RuntimeChannel<T>;
  /** Publish an event to this instance's channel. */
  publish: (event: T) => Promise<void>;
  /**
   * Subscribe to channel events.
   * The subscription is automatically cleaned up when the component unmounts.
   */
  subscribe: (listener: (event: T) => void) => () => void;
  /** True once the channel is active (always true for LocalChannel). */
  isConnected: boolean;
  /** Number of peers in the session (always 1 for solo). */
  peerCount: number;
}

// -- Hook ----------------------------------------------------------------------

export function useSharedEnginChannel<T extends RuntimeChannelEvent = RuntimeChannelEvent>({
  enginName,
  instanceId,
  region = 'homedream',
  mode = 'solo',
}: SharedEnginChannelOptions): SharedEnginChannelResult<T> {
  const { spawn, instances } = useInstanceManager();
  const channelRef = useRef<RuntimeChannel<T> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount,   setPeerCount]   = useState(1);

  // -- Spawn or retrieve instance ---------------------------------------------

  useEffect(() => {
    const instance = spawn(enginName, instanceId, region, mode);

    // The instance manager stores RuntimeChannel<RuntimeChannelEvent>; we
    // cast it here — callers are responsible for consistent event shapes.
    channelRef.current = instance.channel as unknown as RuntimeChannel<T>;
    setIsConnected(true);

    // For co-op, subscribe to peer_join/peer_leave to track peerCount.
    const off = (instance.channel as RuntimeChannel<RuntimeChannelEvent>).subscribe(
      (evt) => {
        if (evt['type'] === 'peer_join')  setPeerCount(n: number => n + 1);
        if (evt['type'] === 'peer_leave') setPeerCount(n: number => Math.max(1, n - 1));
      },
    );

    return () => {
      off();
      // We do NOT destroy the instance on unmount — instances outlive component
      // renders so state is preserved when the Engin remounts in another region.
    };
   
  }, [enginName, instanceId, region]);

  useEffect(() => {
    if (mode !== 'coop') return;
    const key = buildInstanceKey(enginName, instanceId);
    const instance = useInstanceManager.getState().instances[key];
    if (instance?.channel.kind === 'realtime') return;
    void promoteInstanceToRealtime(key);
  }, [enginName, instanceId, mode]);

  // -- Re-sync channelRef when manager promotes an instance to co-op ---------

  useEffect(() => {
    const key = `${enginName}:${instanceId}`;
    const instance = instances[key];
    if (instance) {
      channelRef.current = instance.channel as unknown as RuntimeChannel<T>;
    }
  }, [enginName, instanceId, instances]);

  // -- publish ----------------------------------------------------------------

  const publish = useCallback(
    async (event: T) => {
      if (channelRef.current) {
        await channelRef.current.publish(event);
      }
    },
    [],
  );

  // -- subscribe --------------------------------------------------------------

  const subscribe = useCallback(
    (listener: (event: T) => void): (() => void) => {
      if (!channelRef.current) {
        // Return a no-op if channel isn't ready yet.
        return () => {};
      }
      return channelRef.current.subscribe(listener);
    },
    [],
  );

  // Return a stable channel reference for callers that need to interact with
  // it directly (e.g. useEffect deps that publish on mount).
  const channel =
    channelRef.current ??
    (createLocalChannel<T>(`${enginName}:${instanceId}:fallback`) as RuntimeChannel<T>);

  return { channel, publish, subscribe, isConnected, peerCount };
}
