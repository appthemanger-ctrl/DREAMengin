'use client';

/**
 * lib/runtime/useEnginCoopSync.ts — Pass 8
 *
 * Shared co-op sync hook for all 6 Engins.
 *
 * Wraps useSharedEnginChannel so each Engin gets a consistent co-op wire
 * with a single hook call — no copy-paste.
 *
 * Guarantees (COOP_AND_SOLO_ROADMAP.md guardrail #1):
 *   The React tree never branches on solo vs co-op. This hook swaps the
 *   channel transport; the Engin's component tree is unchanged.
 *
 * Usage (inside any Engin):
 *   const { publish, isCoopActive } = useEnginCoopSync({
 *     enginName: 'LabEngin',
 *     instanceId,
 *     active: collabLabActive,
 *     stateSnapshot: () => ({ type: 'lab:state', experiment: activeExperiment }),
 *     onPeerState: (evt) => {
 *       if (evt.type === 'lab:state') setActiveExperiment(evt.experiment as string);
 *     },
 *   });
 *
 *   // Then in the collab toggle handler, just set `active` state — the hook
 *   // publishes the snapshot automatically when `active` flips to true.
 */

import { useEffect } from 'react';
import { useSharedEnginChannel } from '@/lib/runtime/useSharedEnginChannel';
import type { EnginName } from '@/lib/runtime/instanceManager';
import type { RuntimeId } from '@/types/module-manifest';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoopEvent = { type: string; [key: string]: unknown };

export interface UseEnginCoopSyncOptions {
  enginName: EnginName;
  instanceId: string;
  region?: RuntimeId;
  /** Whether collab is currently active for this Engin session. */
  active: boolean;
  /**
   * Called to get the current state snapshot when `active` becomes true.
   * Must be a stable callback (wrap in useCallback) to avoid thrashing.
   */
  stateSnapshot: () => CoopEvent;
  /**
   * Called when a peer broadcasts a state event.
   * Apply the incoming state to local useState setters here.
   */
  onPeerState?: (event: CoopEvent) => void;
}

export interface UseEnginCoopSyncResult {
  /**
   * Manually publish an event to all peers (e.g. on a granular state change
   * like a beat-grid toggle). Only meaningful while `active === true`.
   */
  publish: (event: CoopEvent) => Promise<void>;
  /** Mirrors the `active` prop — convenient for conditional rendering. */
  isCoopActive: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEnginCoopSync({
  enginName,
  instanceId,
  region = 'homedream',
  active,
  stateSnapshot,
  onPeerState,
}: UseEnginCoopSyncOptions): UseEnginCoopSyncResult {
  const { publish, subscribe } = useSharedEnginChannel<CoopEvent>({
    enginName,
    instanceId,
    region,
    mode: active ? 'coop' : 'solo',
  });

  // ── When collab becomes active: publish our state so late-joining peers sync ─

  useEffect(() => {
    if (!active) return;
    const snapshot = stateSnapshot();
    void publish(snapshot);
  // stateSnapshot intentionally excluded — fire once on activation only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, publish]);

  // ── Subscribe to peer events for the lifetime of an active session ────────

  useEffect(() => {
    if (!active || !onPeerState) return;
    const off = subscribe((evt) => {
      onPeerState(evt);
    });
    return off;
  }, [active, subscribe, onPeerState]);

  return { publish, isCoopActive: active };
}
