'use client';

/**
 * lib/engins/music/useStarMakerEnginRuntime.ts
 *
 * React hook — wires the universal EnginRuntime + StarMakerEngin rule-set into
 * React's lifecycle so the component can dispatch actions and read derived state.
 *
 * Usage:
 *   const { state, dispatch } = useStarMakerEnginRuntime();
 *   dispatch({ type: 'music:bpm-set', payload: { bpm: 140 } });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import { STAR_MAKER_ENGIN_RULE_SET } from './starMakerEnginRuleSet';
import type { StarMakerEnginAction, StarMakerEnginDerivedState } from './starMakerEnginRuleSet';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';

export interface UseStarMakerEnginRuntimeOptions
  extends Omit<EnginRuntimeOptions, 'ioAdapter'> {
  useMemoryAdapter?: boolean;
}

export interface UseStarMakerEnginRuntimeResult {
  state: StarMakerEnginDerivedState;
  dispatch: (action: StarMakerEnginAction) => boolean;
  ready: boolean;
}

export function useStarMakerEnginRuntime(
  options: UseStarMakerEnginRuntimeOptions = {},
): UseStarMakerEnginRuntimeResult {
  const { useMemoryAdapter, ...runtimeOptions } = options;

  const runtimeRef = useRef<EnginRuntime<StarMakerEnginAction> | null>(null);

  if (!runtimeRef.current) {
    const resolvedOptions: EnginRuntimeOptions = {
      ...runtimeOptions,
      ...(useMemoryAdapter ? { ioAdapter: new MemoryAdapter() } : {}),
    };
    runtimeRef.current = new EnginRuntime(STAR_MAKER_ENGIN_RULE_SET, resolvedOptions);
  }

  const runtime = runtimeRef.current;

  const [derivedState, setDerivedState] = useState<StarMakerEnginDerivedState>(
    () => runtime.getDerivedState() as unknown as StarMakerEnginDerivedState,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rt = runtimeRef.current!;

    const handleState = () => {
      setDerivedState(rt.getDerivedState() as unknown as StarMakerEnginDerivedState);
    };

    rt.bus.on('engin:state', handleState);
    rt.start();

    rt.restore().finally(() => {
      setDerivedState(rt.getDerivedState() as unknown as StarMakerEnginDerivedState);
      setReady(true);
    });

    return () => {
      rt.bus.off('engin:state', handleState);
      if (!rt.bus.destroyed) rt.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((action: StarMakerEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    return rt.dispatch(action);
  }, []);

  return { state: derivedState, dispatch, ready };
}
