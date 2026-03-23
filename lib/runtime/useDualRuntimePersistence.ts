'use client';
/**
 * useDualRuntimePersistence — persists DualRuntimeState to localStorage.
 *
 * Phase 8 §G Point 63: Dual runtime state (top/bottom, dominant runtime)
 * persists to localStorage and restores on reload — user returns to the
 * same runtime configuration they left.
 *
 * Architecture justification: ARCHITECTURE.md §1 (Dual Runtime regions).
 * Performance: localStorage is synchronous but tiny payload — no network cost.
 * Privacy: runtime layout is not user-generated content; local storage only.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_DUAL_RUNTIME,
  setRuntimeWorld,
  swapDominantRuntime,
  makeHomeActiveTop,
  type DualRuntimeState,
  type RuntimeWorld,
} from './dualRuntime';

const STORAGE_KEY = 'de-dual-runtime-state';

/** Serialize RuntimeWorld to/from a JSON-safe form */
function serializeWorld(world: RuntimeWorld): string {
  if (typeof world === 'string') return JSON.stringify({ kind: 'string', value: world });
  return JSON.stringify({ kind: 'object', value: world });
}

function deserializeWorld(raw: string): RuntimeWorld {
  try {
    const parsed = JSON.parse(raw) as { kind: 'string' | 'object'; value: RuntimeWorld };
    return parsed.value;
  } catch {
    return DEFAULT_DUAL_RUNTIME.surfaceSpaceWorld;
  }
}

/** Safe JSON serializer for DualRuntimeState */
function serializeState(state: DualRuntimeState): string {
  return JSON.stringify({
    surfaceSpaceWorld: serializeWorld(state.surfaceSpaceWorld),
    dreamSpaceWorld:   serializeWorld(state.dreamSpaceWorld),
    dominantRegion:    state.dominantRegion,
  });
}

function deserializeState(raw: string): DualRuntimeState {
  try {
    const obj = JSON.parse(raw) as {
      surfaceSpaceWorld: string;
      dreamSpaceWorld: string;
      dominantRegion: 'Surface Space' | 'DreamSpace';
    };
    return {
      surfaceSpaceWorld: deserializeWorld(obj.surfaceSpaceWorld),
      dreamSpaceWorld:   deserializeWorld(obj.dreamSpaceWorld),
      dominantRegion:    obj.dominantRegion ?? DEFAULT_DUAL_RUNTIME.dominantRegion,
    };
  } catch {
    return DEFAULT_DUAL_RUNTIME;
  }
}

export interface UseDualRuntimePersistenceReturn {
  state: DualRuntimeState;
  setTopWorld: (world: RuntimeWorld) => void;
  setBottomWorld: (world: RuntimeWorld) => void;
  swapDominant: () => void;
  goHome: () => void;
}

/**
 * useDualRuntimePersistence
 *
 * Manages DualRuntimeState with automatic localStorage persistence.
 * State is restored from localStorage on mount; any state change is
 * written back immediately (synchronous, tiny payload).
 *
 * @example
 * const { state, setTopWorld, swapDominant, goHome } = useDualRuntimePersistence();
 */
export function useDualRuntimePersistence(): UseDualRuntimePersistenceReturn {
  const [state, setState] = useState<DualRuntimeState>(() => {
    if (typeof window === 'undefined') return DEFAULT_DUAL_RUNTIME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return deserializeState(raw);
    } catch { /* ignore */ }
    return DEFAULT_DUAL_RUNTIME;
  });

  // Persist any state change to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch { /* ignore quota errors */ }
  }, [state]);

  const setTopWorld = useCallback((world: RuntimeWorld) => {
    setState(prev => setRuntimeWorld(prev, 'top', world));
  }, []);

  const setBottomWorld = useCallback((world: RuntimeWorld) => {
    setState(prev => setRuntimeWorld(prev, 'bottom', world));
  }, []);

  const swapDominant = useCallback(() => {
    setState(prev => swapDominantRuntime(prev));
  }, []);

  const goHome = useCallback(() => {
    setState(prev => makeHomeActiveTop(prev));
  }, []);

  return { state, setTopWorld, setBottomWorld, swapDominant, goHome };
}
