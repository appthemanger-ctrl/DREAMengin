'use client';

/**
 * lib/engins/lab/useLabEnginRuntime.ts
 *
 * React hook — wires the universal EnginRuntime + LabEngin rule-set into
 * React's lifecycle so the component can dispatch actions and read derived state.
 *
 * Usage:
 *   const { state, dispatch } = useLabEnginRuntime();
 *   dispatch({ type: 'lab:sim-start', payload: { kind: 'quantum' } });
 */

import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LabEnginAction, LabEnginDerivedState } from './labEnginRuleSet';
import { LAB_ENGIN_RULE_SET } from './labEnginRuleSet';

export interface UseLabEnginRuntimeOptions
  extends Omit<EnginRuntimeOptions, 'ioAdapter'> {
  useMemoryAdapter?: boolean;
}

export interface UseLabEnginRuntimeResult {
  state: LabEnginDerivedState;
  dispatch: (action: LabEnginAction) => boolean;
  ready: boolean;
}

export function useLabEnginRuntime(
  options: UseLabEnginRuntimeOptions = {},
): UseLabEnginRuntimeResult {
  const { useMemoryAdapter, ...runtimeOptions } = options;

  const runtimeRef = useRef<EnginRuntime<LabEnginAction> | null>(null);

  if (!runtimeRef.current) {
    const resolvedOptions: EnginRuntimeOptions = {
      ...runtimeOptions,
      ...(useMemoryAdapter ? { ioAdapter: new MemoryAdapter() } : {}),
    };
    runtimeRef.current = new EnginRuntime(LAB_ENGIN_RULE_SET, resolvedOptions);
  }

  const runtime = runtimeRef.current;

  const [derivedState, setDerivedState] = useState<LabEnginDerivedState>(
    () => runtime.getDerivedState() as unknown as LabEnginDerivedState,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rt = runtimeRef.current!;

    const handleState = () => {
      setDerivedState(rt.getDerivedState() as unknown as LabEnginDerivedState);
    };

    rt.bus.on('engin:state', handleState);
    rt.start();

    rt.restore().finally(() => {
      setDerivedState(rt.getDerivedState() as unknown as LabEnginDerivedState);
      setReady(true);
    });

    return () => {
      rt.bus.off('engin:state', handleState);
      if (!rt.bus.destroyed) rt.stop();
    };
   
  }, []);

  const dispatch = useCallback((action: LabEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    return rt.dispatch(action);
  }, []);

  return { state: derivedState, dispatch, ready };
}
