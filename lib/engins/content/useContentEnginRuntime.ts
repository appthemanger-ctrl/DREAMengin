'use client';

/**
 * lib/engins/content/useContentEnginRuntime.ts
 *
 * React hook — wires the universal EnginRuntime + ContentEngin rule-set into
 * React's lifecycle so the component can dispatch actions and read derived state.
 *
 * Usage:
 *   const { state, dispatch } = useContentEnginRuntime();
 *   dispatch({ type: 'content:creativity-set', payload: { level: 75 } });
 */

import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentEnginAction, ContentEnginDerivedState } from './contentEnginRuleSet';
import { CONTENT_ENGIN_RULE_SET } from './contentEnginRuleSet';

export interface UseContentEnginRuntimeOptions
  extends Omit<EnginRuntimeOptions, 'ioAdapter'> {
  useMemoryAdapter?: boolean;
}

export interface UseContentEnginRuntimeResult {
  state: ContentEnginDerivedState;
  dispatch: (action: ContentEnginAction) => boolean;
  ready: boolean;
}

export function useContentEnginRuntime(
  options: UseContentEnginRuntimeOptions = {},
): UseContentEnginRuntimeResult {
  const { useMemoryAdapter, ...runtimeOptions } = options;

  const runtimeRef = useRef<EnginRuntime<ContentEnginAction> | null>(null);

  if (!runtimeRef.current) {
    const resolvedOptions: EnginRuntimeOptions = {
      ...runtimeOptions,
      ...(useMemoryAdapter ? { ioAdapter: new MemoryAdapter() } : {}),
    };
    runtimeRef.current = new EnginRuntime(CONTENT_ENGIN_RULE_SET, resolvedOptions);
  }

  const runtime = runtimeRef.current;

  const [derivedState, setDerivedState] = useState<ContentEnginDerivedState>(
    () => runtime.getDerivedState() as unknown as ContentEnginDerivedState,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rt = runtimeRef.current!;

    const handleState = () => {
      setDerivedState(rt.getDerivedState() as unknown as ContentEnginDerivedState);
    };

    rt.bus.on('engin:state', handleState);
    rt.start();

    rt.restore().finally(() => {
      setDerivedState(rt.getDerivedState() as unknown as ContentEnginDerivedState);
      setReady(true);
    });

    return () => {
      rt.bus.off('engin:state', handleState);
      if (!rt.bus.destroyed) rt.stop();
    };
   
  }, []);

  const dispatch = useCallback((action: ContentEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    return rt.dispatch(action);
  }, []);

  return { state: derivedState, dispatch, ready };
}
