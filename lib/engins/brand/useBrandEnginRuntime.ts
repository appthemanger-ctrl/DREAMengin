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

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnginRuntime } from '@/lib/engin-runtime/EnginRuntime';
import { MemoryAdapter } from '@/lib/engin-runtime/EnginIOAdapter';
import { BRAND_ENGIN_RULE_SET } from './brandEnginRuleSet';
import type { BrandEnginAction, BrandEnginDerivedState } from './brandEnginRuleSet';
import type { EnginRuntimeOptions } from '@/lib/engin-runtime/EnginRuntime';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((action: BrandEnginAction): boolean => {
    const rt = runtimeRef.current;
    if (!rt) return false;
    return rt.dispatch(action);
  }, []);

  return { state: derivedState, dispatch, ready };
}
