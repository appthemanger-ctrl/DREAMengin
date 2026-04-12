'use client';

/**
 * DreamSystemContext — global state for system overlays and runtime dispatch.
 *
 * DreamDMBar now lives in app/layout.tsx (Shell-First architecture) so it is
 * never unmounted during client-side navigation. It reads split/minimized state
 * from this context, which HomeSystem writes when the dual runtime is active.
 *
 * This context carries:
 *   - DualBottomMenu open/close state
 *   - DrEamsPanel open/close state
 *   - runtimeCallbacks: thin bridge so GlobalDreamBar's menus can call
 *     returnHome and openInSurface on the active HomeSystem
 *   - openInSurface: stable accessor used by any component (panels, menus)
 *   - barIntent: active input mode for the DreamDM Bar
 *     (post / search / message / dreams / comment)
 *   - splitRatio / isBarMinimized: shared bar position state written by
 *     HomeSystem and read by the persistent DreamDMBar in layout.tsx
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { SystemPanelId } from '@/lib/panels/panelTypes';

// ── Bar intent types ──────────────────────────────────────────────────────────

/**
 * The DreamDM Bar operates in one of these intent modes.
 *   default  — surface-detected default (post on feed, send on messages, etc.)
 *   search   — universal search (friends, content, surfaces)
 *   message  — compose / reply to a DM
 *   dreams   — ask Dr. Eams
 *   comment  — comment on a specific post (targetPostId required)
 */
export type BarIntentMode = 'default' | 'search' | 'message' | 'dreams' | 'comment';

export interface BarIntent {
  mode: BarIntentMode;
  /** For comment mode: the post ID to comment on */
  targetPostId?: string;
  /** Human-readable label shown in the bar (e.g. "Replying to @handle") */
  targetLabel?: string;
}

export const DEFAULT_BAR_INTENT: BarIntent = { mode: 'default' };

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
  /** Open DreamSpace in the bottom runtime region */
  openHomeDreamSpace?: () => void;
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

  /** Active bar intent mode — drives DreamDM Bar behaviour */
  barIntent: BarIntent;
  setBarIntent:   (intent: BarIntent) => void;
  clearBarIntent: () => void;

  /**
   * Split-screen divider ratio shared between HomeSystem and the persistent
   * DreamDMBar in layout.tsx.
   *   0.0 = DreamSpace fills the viewport
   *   0.5 = 50/50 balanced split
   *   1.0 = Surface Space fills the viewport (bar at bottom)
   * Defaults to 0.5. HomeSystem writes this; DreamDMBar reads and writes it.
   */
  splitRatio: number;
  setSplitRatio: Dispatch<SetStateAction<number>>;

  /** Whether the DreamDMBar is in minimized/hidden state */
  isBarMinimized: boolean;
  setIsBarMinimized: Dispatch<SetStateAction<boolean>>;
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
  barIntent:                  DEFAULT_BAR_INTENT,
  setBarIntent:               () => {},
  clearBarIntent:             () => {},
  splitRatio:                 0.5,
  setSplitRatio:              () => {},
  isBarMinimized:             false,
  setIsBarMinimized:          () => {},
});

export function DreamSystemProvider({ children }: { children: ReactNode }) {
  const [bothMenusOpen, setBothMenusOpen]       = useState(false);
  const [drEamsOpen,    setDrEamsOpen]           = useState(false);
  const [runtimeCallbacks, setRuntimeCallbacks] = useState<RuntimeCallbacks | null>(null);
  const [barIntent,     setBarIntentState]       = useState<BarIntent>(DEFAULT_BAR_INTENT);
  const [splitRatio,    setSplitRatio]           = useState(0.5);
  const [isBarMinimized, setIsBarMinimized]      = useState(false);

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

  const setBarIntent   = useCallback((intent: BarIntent) => setBarIntentState(intent), []);
  const clearBarIntent = useCallback(() => setBarIntentState(DEFAULT_BAR_INTENT), []);

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
      barIntent,
      setBarIntent,
      clearBarIntent,
      splitRatio,
      setSplitRatio,
      isBarMinimized,
      setIsBarMinimized,
    }}>
      {children}
    </DreamSystemContext.Provider>
  );
}

export const useDreamSystem = () => useContext(DreamSystemContext);
