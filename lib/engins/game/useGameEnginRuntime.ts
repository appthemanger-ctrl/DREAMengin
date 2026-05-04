'use client';

/**
 * lib/engins/game/useGameEnginRuntime.ts
 *
 * React hook — wires the universal EnginRuntime + GameEngin rule-set into
 * React's lifecycle so the component can dispatch actions and read derived state.
 *
 * Usage:
 *   const { state, dispatch } = useGameEnginRuntime();
 *   dispatch({ type: 'game:session-start', payload: { gameId: 'platformer' } });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import { GAME_ENGIN_RULE_SET } from './gameEnginRuleSet';
import type { GameEnginAction, GameEnginDerivedState } from './gameEnginRuleSet';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';

export interface UseGameEnginRuntimeOptions
  extends Omit<EnginRuntimeOptions, 'ioAdapter'> {
  /** Use MemoryAdapter instead of LocalStorageAdapter (useful in tests/SSR). */
  useMemoryAdapter?: boolean;
}

export interface UseGameEnginRuntimeResult {
  /** The projected domain state — updates trigger React re-renders. */
  state: GameEnginDerivedState;
  /** Dispatch a GameEnginAction to the runtime. */
  dispatch: (action: GameEnginAction) => boolean;
  /** Whether the runtime has finished the initial restore from storage. */
  ready: boolean;
}

export function useGameEnginRuntime(
  options: UseGameEnginRuntimeOptions = {},
): UseGameEnginRuntimeResult {
  const { useMemoryAdapter, ...runtimeOptions } = options;

  // Build the runtime once per mount.
  const runtimeRef = useRef<EnginRuntime<GameEnginAction> | null>(null);

  if (!runtimeRef.current) {
    const resolvedOptions: EnginRuntimeOptions = {
      ...runtimeOptions,
      ...(useMemoryAdapter ? { ioAdapter: new MemoryAdapter() } : {}),
    };
    runtimeRef.current = new EnginRuntime(GAME_ENGIN_RULE_SET, resolvedOptions);
  }

  const runtime = runtimeRef.current;

  // Initialise derived state from the runtime.
  const [derivedState, setDerivedState] = useState<GameEnginDerivedState>(
    () => runtime.getDerivedState() as unknown as GameEnginDerivedState,
  );
  const [ready, setReady] = useState(false);

  // Subscribe to state-change events and trigger re-render.
  useEffect(() => {
    const rt = runtimeRef.current!;

    const handleState = () => {
      setDerivedState(rt.getDerivedState() as unknown as GameEnginDerivedState);
    };

    rt.bus.on('engin:state', handleState);
    rt.start();

    // Restore persisted domain state.
    rt.restore().finally(() => {
      setDerivedState(rt.getDerivedState() as unknown as GameEnginDerivedState);
      setReady(true);
    });

    return () => {
      rt.bus.off('engin:state', handleState);
      if (!rt.bus.destroyed) rt.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((action: GameEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    const applied = rt.dispatch(action);
    if (applied) {
      setDerivedState(rt.getDerivedState() as unknown as GameEnginDerivedState);
    }
    return applied;
  }, []);

  return { state: derivedState, dispatch, ready };
}
