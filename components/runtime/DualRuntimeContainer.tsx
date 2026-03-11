'use client';

/**
 * DualRuntimeContainer
 *
 * Manages two independent runtime views (top and bottom).
 * The DreamDM Bar controls which runtime is dominant (visible).
 *
 * Each runtime is an independent view that can display:
 * - Home
 * - DreamSpace
 * - Dreams
 * - Engins
 * - Any system world
 *
 * Both runtimes can display the same content simultaneously.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  type DualRuntimeState,
  type RuntimeWorld,
  DEFAULT_DUAL_RUNTIME,
  setRuntimeWorld,
  swapDominantRuntime,
  makeHomeActiveTop,
  isHomeActiveTop,
} from '@/lib/runtime/dualRuntime';

interface DualRuntimeContextValue {
  state: DualRuntimeState;
  setTopRuntime: (world: RuntimeWorld) => void;
  setBottomRuntime: (world: RuntimeWorld) => void;
  swapDominance: () => void;
  goToHome: () => void;
  isHomeActive: () => boolean;
}

const DualRuntimeContext = createContext<DualRuntimeContextValue | null>(null);

export function useDualRuntime(): DualRuntimeContextValue {
  const ctx = useContext(DualRuntimeContext);
  if (!ctx) throw new Error('useDualRuntime must be used within DualRuntimeContainer');
  return ctx;
}

interface DualRuntimeContainerProps {
  children: (props: {
    topRuntime: RuntimeWorld;
    bottomRuntime: RuntimeWorld;
    dominantRuntime: 'top' | 'bottom';
  }) => React.ReactNode;
}

export default function DualRuntimeContainer({ children }: DualRuntimeContainerProps) {
  const [state, setState] = useState<DualRuntimeState>(DEFAULT_DUAL_RUNTIME);

  const setTopRuntime = useCallback((world: RuntimeWorld) => {
    setState((prev) => setRuntimeWorld(prev, 'top', world));
  }, []);

  const setBottomRuntime = useCallback((world: RuntimeWorld) => {
    setState((prev) => setRuntimeWorld(prev, 'bottom', world));
  }, []);

  const swapDominance = useCallback(() => {
    setState((prev) => swapDominantRuntime(prev));
  }, []);

  const goToHome = useCallback(() => {
    setState((prev) => {
      // If Home is already the active top runtime, this will be a "refresh"
      // Otherwise, make Home the active top runtime
      return makeHomeActiveTop(prev);
    });
  }, []);

  const isHomeActive = useCallback(() => {
    return isHomeActiveTop(state);
  }, [state]);

  const value: DualRuntimeContextValue = {
    state,
    setTopRuntime,
    setBottomRuntime,
    swapDominance,
    goToHome,
    isHomeActive,
  };

  return (
    <DualRuntimeContext.Provider value={value}>
      {children({
        topRuntime: state.topRuntime,
        bottomRuntime: state.bottomRuntime,
        dominantRuntime: state.dominantRuntime,
      })}
    </DualRuntimeContext.Provider>
  );
}
