'use client';

/**
 * DreamSystemContext — global state for the DreamDM Bar and dual menus.
 *
 * Allows DreamDMBar + DualBottomMenu to live in the root layout (so they
 * persist across every surface/route) while HomeSystem can still register
 * its runtime-specific callbacks (blend, mode, returnHome).
 */

import React, {
  createContext,
  useCallback,
  useContext,
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
