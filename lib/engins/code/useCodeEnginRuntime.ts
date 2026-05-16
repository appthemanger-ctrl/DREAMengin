'use client';

/**
 * lib/engins/code/useCodeEnginRuntime.ts
 *
 * React hook — wires the universal EnginRuntime + CodeEngin rule-set into
 * React's lifecycle so the component can dispatch actions and read derived state.
 *
 * Usage:
 *   const { state, dispatch } = useCodeEnginRuntime();
 *   dispatch({ type: 'code:ci-start', payload: {} });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import { CODE_ENGIN_RULE_SET } from './codeEnginRuleSet';
import type { CodeEnginAction, CodeEnginDerivedState } from './codeEnginRuleSet';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';

export interface UseCodeEnginRuntimeOptions
  extends Omit<EnginRuntimeOptions, 'ioAdapter'> {
  useMemoryAdapter?: boolean;
}

export interface UseCodeEnginRuntimeResult {
  state: CodeEnginDerivedState;
  dispatch: (action: CodeEnginAction) => boolean;
  ready: boolean;
}

export function useCodeEnginRuntime(
  options: UseCodeEnginRuntimeOptions = {},
): UseCodeEnginRuntimeResult {
  const { useMemoryAdapter, ...runtimeOptions } = options;

  const runtimeRef = useRef<EnginRuntime<CodeEnginAction> | null>(null);

  if (!runtimeRef.current) {
    const resolvedOptions: EnginRuntimeOptions = {
      ...runtimeOptions,
      ...(useMemoryAdapter ? { ioAdapter: new MemoryAdapter() } : {}),
    };
    runtimeRef.current = new EnginRuntime(CODE_ENGIN_RULE_SET, resolvedOptions);
  }

  const runtime = runtimeRef.current;

  const [derivedState, setDerivedState] = useState<CodeEnginDerivedState>(
    () => runtime.getDerivedState() as unknown as CodeEnginDerivedState,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rt = runtimeRef.current!;

    const handleState = () => {
      setDerivedState(rt.getDerivedState() as unknown as CodeEnginDerivedState);
    };

    rt.bus.on('engin:state', handleState);
    rt.start();

    rt.restore().finally(() => {
      setDerivedState(rt.getDerivedState() as unknown as CodeEnginDerivedState);
      setReady(true);
    });

    return () => {
      rt.bus.off('engin:state', handleState);
      if (!rt.bus.destroyed) rt.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((action: CodeEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    return rt.dispatch(action);
  }, []);

  return { state: derivedState, dispatch, ready };
}
