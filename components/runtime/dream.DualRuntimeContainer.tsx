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
 * Torus navigation: each region is a stable scroll root. Focus moves are
 * implemented as `scrollIntoView` calls targeting anchor elements within
 * the chosen viewport — this is the "camera panning on one page" model.
 *
 * Naming: uses canonical region names from lib/identity/canonical-names.ts.
 * Architecture: docs/ARCHITECTURE.md §1 (Runtime regions)
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
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

  /**
   * Register the scroll-root ref for a viewport so anchor-based focus works.
   * Called by the viewport's scroll container on mount.
   * viewport: 'top' = Surface Space, 'bottom' = DreamSpace
   */
  registerViewportRef: (viewport: 'top' | 'bottom', ref: React.RefObject<HTMLElement | null>) => void;

  /**
   * Scroll a viewport to an element with the given anchor id.
   * This is the "camera moves to region" primitive for torus navigation.
   * If the element is not found in the viewport's scroll root, falls back
   * to a global document search.
   */
  focusInViewport: (viewport: 'top' | 'bottom', anchorId: string) => void;
}

const DualRuntimeContext = createContext<DualRuntimeContextValue | null>(null);

export function useDualRuntime(: DualRuntimeContextValue) {
  const ctx = useContext(DualRuntimeContext);
  if (!ctx) throw new Error('useDualRuntime must be used within DualRuntimeContainer');
  return ctx;
}

interface DualRuntimeContainerProps {
  children: React.ReactNode;
}

export default function DualRuntimeContainer() { children }: DualRuntimeContainerProps {
  const [state, setState] = useState<DualRuntimeState>(DEFAULT_DUAL_RUNTIME);

  // Refs to the scroll-root elements for each viewport.
  // Populated via registerViewportRef from the PersistentDreamBar scroll containers.
  const topViewportRef    = useRef<React.RefObject<HTMLElement | null> | null>(null);
  const bottomViewportRef = useRef<React.RefObject<HTMLElement | null> | null>(null);

  const setTopRuntime = useCallback((world: RuntimeWorld) => {
    setState(prev: Record<string, unknown> => setRuntimeWorld(prev, 'top', world));
  }, []);

  const setBottomRuntime = useCallback((world: RuntimeWorld) => {
    setState(prev: Record<string, unknown> => setRuntimeWorld(prev, 'bottom', world));
  }, []);

  const swapDominance = useCallback(() => {
    setState(prev: Record<string, unknown> => swapDominantRuntime(prev));
  }, []);

  const setDominantRuntime = useCallback((region: 'Surface Space' | 'DreamSpace') => {
    setState(prev: Record<string, unknown> => ({ ...prev, dominantRegion: region }));
  }, []);

  const goToHome = useCallback(() => {
    setState(prev: Record<string, unknown> => makeHomeActiveTop(prev));
  }, []);

  const goToHomeDreamSpace = useCallback(() => {
    setState(prev: Record<string, unknown> => makeHomeDreamSpaceActive(prev));
  }, []);

  const goToDreamSpace = useCallback(() => {
    setState(prev: Record<string, unknown> => makeDreamSpaceActiveSurface(prev));
  }, []);

  const isHomeActive = useCallback(() => {
    return isHomeActiveTop(state);
  }, [state]);

  // ── Anchor-based viewport focus (torus "camera pan") ─────────────────────

  const registerViewportRef = useCallback((
    viewport: 'top' | 'bottom',
    ref: React.RefObject<HTMLElement | null>,
  ) => {
    if (viewport === 'top') {
      topViewportRef.current = ref;
    } else {
      bottomViewportRef.current = ref;
    }
  }, []);

  const focusInViewport = useCallback((viewport: 'top' | 'bottom', anchorId: string) => {
    const rootRef = viewport === 'top' ? topViewportRef.current : bottomViewportRef.current;
    const root = rootRef?.current ?? null;

    // Use CSS.escape for both selector patterns to handle IDs with special characters.
    const escapedId = CSS.escape(anchorId);

    // Try to find the anchor within the registered scroll root first
    const target = root
      ? root.querySelector(`#${escapedId}`)
      : null;

    // Fall back to global document search if not in viewport root
    const el = target ?? document.getElementById(anchorId);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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
    registerViewportRef,
    focusInViewport,
  };

  return (
    <DualRuntimeContext.Provider value={value}>
      {children}
    </DualRuntimeContext.Provider>
  );
}
