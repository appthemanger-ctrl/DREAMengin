'use client';

/**
 * DualRuntimeContainer
 *
 * Manages two independent runtime regions (Surface Space and DreamSpace).
 * The DreamDM Bar controls which region is dominant (visible).
 *
 * Each region is an independent view that can display:
 * - HomeDream Surface
 * - DreamSpace
 * - Dream Windows
 * - Engins
 * - Any system world
 *
 * Both regions can display the same world simultaneously.
 *
 * Naming: uses canonical region names from lib/identity/canonical-names.ts.
 * Architecture: docs/ARCHITECTURE.md §1 (Runtime regions)
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  type DualRuntimeState,
  type RuntimeWorld,
  DEFAULT_DUAL_RUNTIME,
  setRuntimeWorld,
  swapDominantRuntime,
  makeHomeActiveTop,
  makeHomeDreamSpaceActive,
  makeDreamSpaceActiveSurface,
  isHomeActiveTop,
} from '@/lib/runtime/dualRuntime';

interface DualRuntimeContextValue {
  state: DualRuntimeState;
  /** Set the world shown in the Surface Space region */
  setTopRuntime: (world: RuntimeWorld) => void;
  /** Set the world shown in the DreamSpace region */
  setBottomRuntime: (world: RuntimeWorld) => void;
  /** Set which region is dominant — 'Surface Space' or 'DreamSpace' */
  setDominantRuntime: (region: 'Surface Space' | 'DreamSpace') => void;
  /** Toggle dominant region */
  swapDominance: () => void;
  /** Navigate to HomeDream Surface in Surface Space and make it dominant */
  goToHome: () => void;
  /**
   * Load HomeDream Surface into the DreamSpace region and make it dominant.
   * Used for the dual-home state: two independent HomeDream views open simultaneously.
   */
  goToHomeDreamSpace: () => void;
  /**
   * Load DreamSpace world into the Surface Space region and make it dominant.
   * Allows Surface Space to show the DreamSpace panel, enabling two independent
   * DreamSpace sessions simultaneously (e.g. two Daydreams or Engins at once).
   */
  goToDreamSpace: () => void;
  /** Returns true if HomeDream Surface is active and Surface Space is dominant */
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
    surfaceSpaceWorld: RuntimeWorld;
    dreamSpaceWorld: RuntimeWorld;
    dominantRegion: 'Surface Space' | 'DreamSpace';
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

  const setDominantRuntime = useCallback((region: 'Surface Space' | 'DreamSpace') => {
    setState((prev) => ({ ...prev, dominantRegion: region }));
  }, []);

  const goToHome = useCallback(() => {
    setState((prev) => makeHomeActiveTop(prev));
  }, []);

  const goToHomeDreamSpace = useCallback(() => {
    setState((prev) => makeHomeDreamSpaceActive(prev));
  }, []);

  const goToDreamSpace = useCallback(() => {
    setState((prev) => makeDreamSpaceActiveSurface(prev));
  }, []);

  const isHomeActive = useCallback(() => {
    return isHomeActiveTop(state);
  }, [state]);

  const value: DualRuntimeContextValue = {
    state,
    setTopRuntime,
    setBottomRuntime,
    setDominantRuntime,
    swapDominance,
    goToHome,
    goToHomeDreamSpace,
    goToDreamSpace,
    isHomeActive,
  };

  return (
    <DualRuntimeContext.Provider value={value}>
      {children({
        surfaceSpaceWorld: state.surfaceSpaceWorld,
        dreamSpaceWorld:   state.dreamSpaceWorld,
        dominantRegion:    state.dominantRegion,
      })}
    </DualRuntimeContext.Provider>
  );
}
