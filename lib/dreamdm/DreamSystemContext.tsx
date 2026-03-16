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

// ── Callback types ────────────────────────────────────────────────────────────

type RuntimeModeFn  = (mode: 'home' | 'blend' | 'dreamspace') => void;
type RuntimeBlendFn = (v: number) => void;
type ReturnHomeFn   = () => void;

export interface RuntimeCallbacks {
  returnHome:  ReturnHomeFn;
  modeChange:  RuntimeModeFn;
  blendChange: RuntimeBlendFn;
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
});

export function DreamSystemProvider({ children }: { children: ReactNode }) {
  const [bothMenusOpen, setBothMenusOpen]       = useState(false);
  const [drEamsOpen,    setDrEamsOpen]           = useState(false);
  const [runtimeCallbacks, setRuntimeCallbacks] = useState<RuntimeCallbacks | null>(null);

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
    }}>
      {children}
    </DreamSystemContext.Provider>
  );
}

export const useDreamSystem = () => useContext(DreamSystemContext);
