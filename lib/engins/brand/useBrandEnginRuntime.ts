'use client';

/**
 * lib/engins/brand/useBrandEnginRuntime.ts
 *
 * React hook — wires the universal EnginRuntime + BrandingEngin rule-set into
 * React's lifecycle so the component can dispatch actions and read derived state.
 *
 * Usage:
 *   const { state, dispatch } = useBrandEnginRuntime();
 *   dispatch({ type: 'brand:metrics-refresh', payload: { metrics: [...] } });
 */

import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrandEnginAction, BrandEnginDerivedState } from './brandEnginRuleSet';
import { BRAND_ENGIN_RULE_SET } from './brandEnginRuleSet';

export interface UseBrandEnginRuntimeOptions
  extends Omit<EnginRuntimeOptions, 'ioAdapter'> {
  useMemoryAdapter?: boolean;
}

export interface UseBrandEnginRuntimeResult {
  state: BrandEnginDerivedState;
  dispatch: (action: BrandEnginAction) => boolean;
  ready: boolean;
}

export function useBrandEnginRuntime(
  options: UseBrandEnginRuntimeOptions = {},
): UseBrandEnginRuntimeResult {
  const { useMemoryAdapter, ...runtimeOptions } = options;

  const runtimeRef = useRef<EnginRuntime<BrandEnginAction> | null>(null);

  if (!runtimeRef.current) {
    const resolvedOptions: EnginRuntimeOptions = {
      ...runtimeOptions,
      ...(useMemoryAdapter ? { ioAdapter: new MemoryAdapter() } : {}),
    };
    runtimeRef.current = new EnginRuntime(BRAND_ENGIN_RULE_SET, resolvedOptions);
  }

  const runtime = runtimeRef.current;

  const [derivedState, setDerivedState] = useState<BrandEnginDerivedState>(
    () => runtime.getDerivedState() as unknown as BrandEnginDerivedState,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rt = runtimeRef.current!;

    const handleState = () => {
      setDerivedState(rt.getDerivedState() as unknown as BrandEnginDerivedState);
    };

    rt.bus.on('engin:state', handleState);
    rt.start();

    rt.restore().finally(() => {
      setDerivedState(rt.getDerivedState() as unknown as BrandEnginDerivedState);
      setReady(true);
    });

    return () => {
      rt.bus.off('engin:state', handleState);
      if (!rt.bus.destroyed) rt.stop();
    };
   
  }, []);

  const dispatch = useCallback((action: BrandEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    return rt.dispatch(action);
  }, []);

  return { state: derivedState, dispatch, ready };
}
