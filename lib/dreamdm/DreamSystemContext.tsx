'use client';

/**
 * DreamSystemContext — global state for system overlays and runtime dispatch.
 *
 * DreamDMBar is no longer in the global layout. It lives inside HomeSystem
 * as the seam between Surface Space and DreamSpace. It is not global.
 *
 * This context carries only what truly needs to be global:
 *   - DualBottomMenu open/close state
 *   - DrEamsPanel open/close state
 *   - runtimeCallbacks: thin bridge so GlobalDreamBar's menus can call
 *     returnHome and openInSurface on the active HomeSystem
 *   - openInSurface: stable accessor used by any component (panels, menus)
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

type ReturnHomeFn     = () => void;
type OpenInSurfaceFn  = (id: SystemPanelId) => void;

/**
 * Callbacks registered by HomeSystem.
 * Only what GlobalDreamBar's overlay menus actually need.
 */
export interface RuntimeCallbacks {
  /** Return to HomeDream Surface and reset bar position */
  returnHome:      ReturnHomeFn;
  /**
   * Load a system feature panel into Surface Space as a RuntimeWorld.
   * No routing. No overlays. The world dispatch in RuntimeView handles rendering.
   */
  openInSurface?:  OpenInSurfaceFn;
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
   * Thin bridge to HomeSystem. Null when HomeSystem is not mounted
   * (i.e. on public/non-home surfaces).
   */
  runtimeCallbacks: RuntimeCallbacks | null;
  registerRuntimeCallbacks:   (cbs: RuntimeCallbacks) => void;
  unregisterRuntimeCallbacks: () => void;

  /**
   * Stable function — load a system feature into Surface Space.
   * Delegates to runtimeCallbacks.openInSurface when HomeSystem is active.
   */
  openInSurface: (id: SystemPanelId) => void;
}

// ── Context + provider ────────────────────────────────────────────────────────

const DreamSystemContext = createContext<DreamSystemContextValue>({
  bothMenusOpen:              false,
  openBothMenus:              () => {},
  closeBothMenus:             () => {},
  drEamsOpen:                 false,
  openDrEams:                 () => {},
  closeDrEams:                () => {},
  runtimeCallbacks:           null,
  registerRuntimeCallbacks:   () => {},
  unregisterRuntimeCallbacks: () => {},
  openInSurface:              () => {},
});

export function DreamSystemProvider({ children }: { children: ReactNode }) {
  const [bothMenusOpen, setBothMenusOpen]       = useState(false);
  const [drEamsOpen,    setDrEamsOpen]           = useState(false);
  const [runtimeCallbacks, setRuntimeCallbacks] = useState<RuntimeCallbacks | null>(null);

  // Stable ref so openInSurface doesn't re-create when callbacks change
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
