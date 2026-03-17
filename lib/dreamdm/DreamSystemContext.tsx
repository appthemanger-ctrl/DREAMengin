'use client';

/**
 * DreamSystemContext — global state for the DreamDM Bar and dual menus.
 *
 * Allows DreamDMBar + DualBottomMenu to live in the root layout (so they
 * persist across every surface/route) while HomeSystem can still register
 * its runtime-specific callbacks (blend, mode, returnHome, openInSurface).
 *
 * openInSurface: loads a system feature INTO the Surface Space region via
 * RuntimeView's world dispatch — no routing, no overlays, in-region only.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SystemPanelId } from '@/lib/panels/panelTypes';

// ── Callback types ────────────────────────────────────────────────────────────

type RuntimeModeFn  = (mode: 'home' | 'blend' | 'dreamspace') => void;
type RuntimeBlendFn = (v: number) => void;
type ReturnHomeFn   = () => void;

export interface RuntimeCallbacks {
  returnHome:       ReturnHomeFn;
  modeChange:       RuntimeModeFn;
  blendChange:      RuntimeBlendFn;
  /**
   * Load HomeDream Surface into the DreamSpace region (bar at top, dual-home).
   * Called when the user double-taps Gold while the bar is locked at the top.
   */
  homeDreamSpace?: () => void;
  /**
   * Load a system feature panel into Surface Space as a RuntimeWorld.
   * No routing. No overlays. The world dispatch in RuntimeView handles rendering.
   */
  openInSurface?: (id: SystemPanelId) => void;
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface DreamSystemContextValue {
  /** Whether the dual bottom menu is open */
  bothMenusOpen: boolean;
  openBothMenus:  () => void;
  closeBothMenus: () => void;

  /** Whether the Dr. Eams panel overlay is open */
  drEamsOpen:  boolean;
  openDrEams:  () => void;
  closeDrEams: () => void;

  /**
   * Callbacks registered by HomeSystem so the global bar can drive
   * the dual-runtime layout (blend, mode switch, return-home, openInSurface).
   * Null when HomeSystem is not mounted.
   */
  runtimeCallbacks: RuntimeCallbacks | null;
  registerRuntimeCallbacks:   (cbs: RuntimeCallbacks) => void;
  unregisterRuntimeCallbacks: () => void;

  /**
   * Load a system feature into Surface Space via dual-runtime world dispatch.
   * Delegates to runtimeCallbacks.openInSurface when HomeSystem is active.
   * Call this from any component — panel, menu, or global bar.
   */
  openInSurface: (id: SystemPanelId) => void;
}

// ── Context + provider ────────────────────────────────────────────────────────

const DreamSystemContext = createContext<DreamSystemContextValue>({
  bothMenusOpen:   false,
  openBothMenus:   () => {},
  closeBothMenus:  () => {},
  drEamsOpen:      false,
  openDrEams:      () => {},
  closeDrEams:     () => {},
  runtimeCallbacks:            null,
  registerRuntimeCallbacks:    () => {},
  unregisterRuntimeCallbacks:  () => {},
  openInSurface:               () => {},
});

export function DreamSystemProvider({ children }: { children: ReactNode }) {
  const [bothMenusOpen, setBothMenusOpen]       = useState(false);
  const [drEamsOpen,    setDrEamsOpen]           = useState(false);
  const [runtimeCallbacks, setRuntimeCallbacks] = useState<RuntimeCallbacks | null>(null);

  // Stable ref so openInSurface doesn't need to be recreated when callbacks change
  const callbacksRef = useRef<RuntimeCallbacks | null>(null);

  const openBothMenus  = useCallback(() => setBothMenusOpen(true),  []);
  const closeBothMenus = useCallback(() => setBothMenusOpen(false), []);
  const openDrEams     = useCallback(() => setDrEamsOpen(true),     []);
  const closeDrEams    = useCallback(() => setDrEamsOpen(false),    []);

  const registerRuntimeCallbacks = useCallback((cbs: RuntimeCallbacks) => {
    callbacksRef.current = cbs;
    setRuntimeCallbacks(cbs);
  }, []);

  const unregisterRuntimeCallbacks = useCallback(() => {
    callbacksRef.current = null;
    setRuntimeCallbacks(null);
  }, []);

  /**
   * Stable function — opens id as a panel world in Surface Space.
   * Works from any component in the tree (menus, panels, GlobalDreamBar).
   */
  const openInSurface = useCallback((id: SystemPanelId) => {
    callbacksRef.current?.openInSurface?.(id);
  }, []);

  return (
    <DreamSystemContext.Provider value={{
      bothMenusOpen,
      openBothMenus,
      closeBothMenus,
      drEamsOpen,
      openDrEams,
      closeDrEams,
      runtimeCallbacks,
      registerRuntimeCallbacks,
      unregisterRuntimeCallbacks,
      openInSurface,
    }}>
      {children}
    </DreamSystemContext.Provider>
  );
}

export const useDreamSystem = () => useContext(DreamSystemContext);


// ── Callback types ────────────────────────────────────────────────────────────

type RuntimeModeFn  = (mode: 'home' | 'blend' | 'dreamspace') => void;
type RuntimeBlendFn = (v: number) => void;
type ReturnHomeFn   = () => void;

export interface RuntimeCallbacks {
  returnHome:       ReturnHomeFn;
  modeChange:       RuntimeModeFn;
  blendChange:      RuntimeBlendFn;
  /**
   * Load HomeDream Surface into the DreamSpace region (bar at top, dual-home).
   * Called when the user double-taps Gold while the bar is locked at the top.
   */
  homeDreamSpace?: () => void;
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface DreamSystemContextValue {
  /** Whether the dual bottom menu is open */
  bothMenusOpen: boolean;
  openBothMenus:  () => void;
  closeBothMenus: () => void;

  /** Whether the Dr. Eams panel overlay is open */
  drEamsOpen:  boolean;
  openDrEams:  () => void;
  closeDrEams: () => void;

  /**
   * Callbacks registered by HomeSystem so the global bar can drive
   * the dual-runtime layout (blend, mode switch, return-home).
   * Null when HomeSystem is not mounted (i.e. on any other surface).
   */
  runtimeCallbacks: RuntimeCallbacks | null;
  registerRuntimeCallbacks:   (cbs: RuntimeCallbacks) => void;
  unregisterRuntimeCallbacks: () => void;

  /**
   * SPA Panel System — no routing, no iframes.
   * All features open as inline React panels within the single page.
   * panelStack is a navigation stack; the last entry is the visible panel.
   */
  panelStack:      SystemPanelId[];
  openPanel:       (id: SystemPanelId) => void;
  closeTopPanel:   () => void;
  closeAllPanels:  () => void;
}

// ── Context + provider ────────────────────────────────────────────────────────

const DreamSystemContext = createContext<DreamSystemContextValue>({
  bothMenusOpen:   false,
  openBothMenus:   () => {},
  closeBothMenus:  () => {},
  drEamsOpen:      false,
  openDrEams:      () => {},
  closeDrEams:     () => {},
  runtimeCallbacks:            null,
  registerRuntimeCallbacks:    () => {},
  unregisterRuntimeCallbacks:  () => {},
  panelStack:     [],
  openPanel:      () => {},
  closeTopPanel:  () => {},
  closeAllPanels: () => {},
});

export function DreamSystemProvider({ children }: { children: ReactNode }) {
  const [bothMenusOpen, setBothMenusOpen]       = useState(false);
  const [drEamsOpen,    setDrEamsOpen]           = useState(false);
  const [runtimeCallbacks, setRuntimeCallbacks] = useState<RuntimeCallbacks | null>(null);
  const [panelStack, setPanelStack]             = useState<SystemPanelId[]>([]);

  const openBothMenus  = useCallback(() => setBothMenusOpen(true),  []);
  const closeBothMenus = useCallback(() => setBothMenusOpen(false), []);
  const openDrEams     = useCallback(() => setDrEamsOpen(true),     []);
  const closeDrEams    = useCallback(() => setDrEamsOpen(false),    []);

  const registerRuntimeCallbacks = useCallback((cbs: RuntimeCallbacks) => {
    setRuntimeCallbacks(cbs);
  }, []);

  const unregisterRuntimeCallbacks = useCallback(() => {
    setRuntimeCallbacks(null);
  }, []);

  const openPanel = useCallback((id: SystemPanelId) => {
    setPanelStack((prev) => [...prev, id]);
  }, []);

  const closeTopPanel = useCallback(() => {
    setPanelStack((prev) => prev.slice(0, -1));
  }, []);

  const closeAllPanels = useCallback(() => {
    setPanelStack([]);
  }, []);

  return (
    <DreamSystemContext.Provider value={{
      bothMenusOpen,
      openBothMenus,
      closeBothMenus,
      drEamsOpen,
      openDrEams,
      closeDrEams,
      runtimeCallbacks,
      registerRuntimeCallbacks,
      unregisterRuntimeCallbacks,
      panelStack,
      openPanel,
      closeTopPanel,
      closeAllPanels,
    }}>
      {children}
    </DreamSystemContext.Provider>
  );
}

export const useDreamSystem = () => useContext(DreamSystemContext);
