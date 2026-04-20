/**
 * lib/runtime/instanceManager.ts — Pass 4
 *
 * Multi-instance Engin manager.
 *
 * Supports running the same Engin in two independent RuntimeView regions
 * simultaneously (e.g. StarMakerEngin in Surface Space AND DreamSpace).
 * Each instance is keyed by `${enginName}:${instanceId}` and carries its own
 * runtimeChannel adapter — solo instances use a LocalChannel, co-op instances
 * use a RealtimeChannel — but the component tree never changes (guardrail #1
 * from COOP_AND_SOLO_ROADMAP.md).
 *
 * Identity rule (decision #3 from COOP_AND_SOLO_ROADMAP.md):
 *   - One Supabase identity, always.
 *   - "Player 2" emerges from the runtimeChannel, not from a second auth session.
 *
 * Persistence:
 *   - Instance list is kept in memory (Zustand).
 *   - For full Supabase persistence, callers may read/write `engin_instances`
 *     rows using the instanceId as the primary key.
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Pass 4 — multi-instance Engin manager).
 */

import { create } from 'zustand';
import type { RuntimeChannel } from '@/lib/runtime/runtimeChannel';
import { createLocalChannel } from '@/lib/runtime/runtimeChannel';
import type { RuntimeId } from '@/types/module-manifest';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnginName =
  | 'StarMakerEngin'
  | 'GameEngin'
  | 'LabEngin'
  | 'CodeEngin'
  | 'BrandingEngin'
  | 'ContentEngin'
  | 'ForgeEngin'
  | (string & {});

export type InstanceMode = 'solo' | 'coop';

/** A single managed Engin instance. */
export interface EnginInstance {
  /** Unique key: `${enginName}:${instanceId}` */
  key: string;
  /** Which Engin this is. */
  enginName: EnginName;
  /** Short stable instance ID (uuid or user-supplied). */
  instanceId: string;
  /** Which runtime region this instance lives in. */
  region: RuntimeId;
  /** Collaboration mode for this instance. */
  mode: InstanceMode;
  /** Channel for inter-instance communication (same-Engin co-op). */
  channel: RuntimeChannel;
  /** Wall-clock ms when this instance was created. */
  createdAt: number;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface InstanceManagerState {
  /** All active instances, keyed by instance key. */
  instances: Record<string, EnginInstance>;
  /**
   * Spawn a new Engin instance.
   * Returns the existing instance if the key is already registered.
   */
  spawn: (
    enginName: EnginName,
    instanceId: string,
    region: RuntimeId,
    mode?: InstanceMode,
  ) => EnginInstance;
  /**
   * Destroy an instance and release its channel.
   * No-op if the instance doesn't exist.
   */
  destroy: (key: string) => void;
  /** Return all instances for a given Engin name. */
  getInstancesForEngin: (enginName: EnginName) => EnginInstance[];
  /** Return all instances in a given runtime region. */
  getInstancesForRegion: (region: RuntimeId) => EnginInstance[];
  /**
   * Promote a solo instance to co-op by swapping its LocalChannel for a
   * RealtimeChannel. The caller is responsible for providing the new channel
   * (use createRealtimeChannel from runtimeChannel.ts).
   */
  promoteToCoOp: (key: string, channel: RuntimeChannel) => void;
}

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useInstanceManager = create<InstanceManagerState>((set, get) => ({
  instances: {},

  spawn(enginName, instanceId, region, mode = 'solo') {
    const key = `${enginName}:${instanceId}`;
    const existing = get().instances[key];
    if (existing) return existing;

    const channel = createLocalChannel(key);
    const instance: EnginInstance = {
      key,
      enginName,
      instanceId,
      region,
      mode,
      channel,
      createdAt: Date.now(),
    };

    set((state) => ({
      instances: { ...state.instances, [key]: instance },
    }));

    return instance;
  },

  destroy(key) {
    const { instances } = get();
    const instance = instances[key];
    if (!instance) return;

    // Async close — fire and forget; no await in Zustand action.
    instance.channel.close().catch(() => {});

    set((state) => {
      const next = { ...state.instances };
      delete next[key];
      return { instances: next };
    });
  },

  getInstancesForEngin(enginName) {
    return Object.values(get().instances).filter((i) => i.enginName === enginName);
  },

  getInstancesForRegion(region) {
    return Object.values(get().instances).filter((i) => i.region === region);
  },

  promoteToCoOp(key, channel) {
    const { instances } = get();
    const instance = instances[key];
    if (!instance) return;

    // Close the old local channel silently.
    instance.channel.close().catch(() => {});

    set((state) => ({
      instances: {
        ...state.instances,
        [key]: { ...instance, channel, mode: 'coop' },
      },
    }));
  },
}));

// ── Convenience helpers ───────────────────────────────────────────────────────

/**
 * buildInstanceKey(enginName, instanceId)
 *
 * Returns the canonical key used throughout the instance manager.
 * Exported so consumers can construct keys without instantiating the store.
 */
export function buildInstanceKey(enginName: EnginName, instanceId: string): string {
  return `${enginName}:${instanceId}`;
}

/**
 * spawnDualInstances(enginName, regionA, regionB)
 *
 * Convenience helper for the Pass 4 use-case: same Engin in two regions.
 * Spawns two solo instances with auto-generated instance IDs and returns them.
 * Callers can later call promoteToCoOp() on either to link them via a shared channel.
 */
export function spawnDualInstances(
  enginName: EnginName,
  regionA: RuntimeId,
  regionB: RuntimeId,
): [EnginInstance, EnginInstance] {
  const idA =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const idB =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const { spawn } = useInstanceManager.getState();
  const a = spawn(enginName, idA, regionA, 'solo');
  const b = spawn(enginName, idB, regionB, 'solo');
  return [a, b];
}
