'use client';

/**
 * DreamSystemContext — global state for system overlays and runtime dispatch.
 *
 * The DreamDM Bar IS home and is always persistent. Both runtime regions
 * (HomeDream Surface / DreamSpace) are always mounted to the bar regardless
 * of the current route. This context bootstraps the homeData needed to
 * render those regions from any page via a client-side Supabase call.
 *
 * DreamBarDataBridge (mounted only on /homedream) enriches homeData with
 * server-fetched posts and registers advanced runtime callbacks.
 *
 * This context carries:
 *   - DualBottomMenu open/close state
 *   - DrEamsPanel open/close state
 *   - runtimeCallbacks: thin bridge so GlobalDreamBar's menus can call
 *     returnHome and openInSurface on the active DreamBarDataBridge
 *   - openInSurface: stable accessor used by any component (panels, menus)
 *   - barIntent: active input mode for the DreamDM Bar
 *   - splitRatio / isBarMinimized: shared bar position state
 *   - homeData: user profile + posts, always populated after auth
 */

import { DEFAULT_SPLIT_RATIO } from '@/lib/dreamdm/barInteractions';
import type { SystemPanelId } from '@/lib/panels/panelTypes';
import {
    moveTorus as computeMoveTorus,
    torusFocusKey,
} from '@/lib/runtime/dualRuntime';
import { createClient } from '@/lib/supabase/client';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from 'react';

// ── Home data shared by DreamBarDataBridge into PersistentDreamBar ───────────

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export interface HomeData {
  userId: string;
  profile: ProfileLike | null;
  initialPosts: unknown[];
  isAdmin: boolean;
}

// ── Bar intent types ──────────────────────────────────────────────────────────

/**
 * The DreamDM Bar operates in one of these intent modes.
 *   default        — surface-detected default (post on feed, send on messages, etc.)
 *   search         — universal search (friends, content, surfaces)
 *   message        — compose / reply to a DM
 *   dreams         — ask Dr. Eams
 *   comment        — comment on a specific post (targetPostId required)
 *   module-actions — contextual actions from the focused module (replaces inline bubbles)
 */
export type BarIntentMode = 'default' | 'search' | 'message' | 'dreams' | 'comment' | 'module-actions';

/** A single contextual action injected by a module into the DreamDM Bar. */
export interface ModuleBarAction {
  id: string;
  label: string;
  icon?: string;
  onAction: () => void;
  active?: boolean;
  disabled?: boolean;
}

export interface BarIntent {
  mode: BarIntentMode;
  /** For comment mode: the post ID to comment on */
  targetPostId?: string;
  /** Human-readable label shown in the bar (e.g. "Replying to @handle") */
  targetLabel?: string;
  /** For module-actions mode: which module's actions are shown */
  moduleId?: string;
  /** For module-actions mode: the actions array to display in the bar */
  moduleActions?: ModuleBarAction[];
}

export const DEFAULT_BAR_INTENT: BarIntent = { mode: 'default' };

// ── World Focus — torus navigation state ─────────────────────────────────────

/**
 * World focus state: where in the "one page / torus world" the user is.
 *
 * focusKey      — canonical string key identifying the focused region
 *                 (e.g. 'home', 'games.library', 'dreamr.feed')
 * worldSelection — context-dependent payload (e.g. { gameId } for games.play,
 *                  { post } for dreamr.youtube)
 * torusX / torusY — current torus position (x = domain, y = surface|engin)
 * dominantViewport — which of the two runtime regions is in focus
 */
export interface WorldFocusState {
  focusKey: string;
  worldSelection: unknown | null;
  torusX: number;
  torusY: number;
  dominantViewport: 'top' | 'bottom';
}

export const DEFAULT_WORLD_FOCUS: WorldFocusState = {
  focusKey:          'home',
  worldSelection:    null,
  torusX:            0,
  torusY:            0,
  dominantViewport:  'top',
};

// ── Callback types ────────────────────────────────────────────────────────────

type ReturnHomeFn     = () => void;
type OpenInSurfaceFn  = (id: SystemPanelId) => void;

/**
 * Callbacks registered by DreamBarDataBridge.
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
  /**
   * Return to DreamSpace as the dominant runtime region.
   * Used by the smart Home button when the DreamDM Bar is dragged toward the
   * top — at that point "home" contextually means DreamSpace, not Surface.
   */
  returnDreamSpace?: () => void;
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
   * Thin bridge to DreamBarDataBridge. Null when DreamBarDataBridge is not
   * mounted (i.e. on non-homedream surfaces). The bar still renders both
   * runtimes regardless — this only controls advanced callback behaviour.
   */
  runtimeCallbacks: RuntimeCallbacks | null;
  registerRuntimeCallbacks:   (cbs: RuntimeCallbacks) => void;
  unregisterRuntimeCallbacks: () => void;

  /**
   * Stable function — load a system feature into Surface Space.
   * Delegates to runtimeCallbacks.openInSurface when DreamBarDataBridge is active.
   */
  openInSurface: (id: SystemPanelId) => void;

  /** Active bar intent mode — drives DreamDM Bar behaviour */
  barIntent: BarIntent;
  setBarIntent:   (intent: BarIntent) => void;
  clearBarIntent: () => void;

  /**
   * Split-screen divider ratio — always active because the bar IS home.
   *   0.0 = DreamSpace fills the viewport (bar at top)
   *   0.5 = 50/50 balanced split
   *   1.0 = HomeDream Surface fills the viewport (bar at bottom)
   * Defaults to 0.9 so the bar rests near the bottom with a DreamSpace sliver.
   * DreamBarDataBridge and DreamDMBar both read and write this.
   */
  splitRatio: number;
  setSplitRatio: Dispatch<SetStateAction<number>>;

  /** Whether the DreamDMBar is in minimized/hidden state */
  isBarMinimized: boolean;
  setIsBarMinimized: Dispatch<SetStateAction<boolean>>;

  /**
   * Home data for the always-mounted runtime regions.
   * Bootstrapped client-side from Supabase on any authenticated page.
   * DreamBarDataBridge enriches this with server-fetched posts when on /homedream.
   */
  homeData: HomeData | null;
  setHomeData: Dispatch<SetStateAction<HomeData | null>>;

  // ── World Focus / Torus Navigation ────────────────────────────────────────

  /**
   * Current world focus state (torus position + focused region key).
   * All components can read this to understand what the user is looking at.
   */
  worldFocus: WorldFocusState;

  /**
   * Set focus to a named region of the world.
   * Updates focusKey + worldSelection without route navigation.
   * Optionally specify which viewport should become dominant.
   *
   * @param key     Focus key (e.g. 'games.play', 'dreamr.youtube')
   * @param payload Optional context payload (e.g. { gameId: '...' })
   * @param viewport Optional viewport preference ('top' | 'bottom')
   */
  setFocus: (key: string, payload?: unknown, viewport?: 'top' | 'bottom') => void;

  /**
   * Move the torus cursor by (dx, dy) with wrap-around.
   * Updates torusX/torusY and derives the new focusKey automatically.
   *
   * @param dx Horizontal delta (positive = right/next domain)
   * @param dy Vertical delta (positive = down / toward engin mode)
   */
  moveTorus: (dx: number, dy: number) => void;

  /**
   * Explicitly set which runtime viewport is dominant (top/bottom).
   * Used when a user interaction (e.g. tapping a feed card) should
   * shift attention to a specific viewport.
   */
  setDominantViewport: (viewport: 'top' | 'bottom') => void;
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
  splitRatio:                 DEFAULT_SPLIT_RATIO,
  setSplitRatio:              () => {},
  isBarMinimized:             false,
  setIsBarMinimized:          () => {},
  homeData:                   null,
  setHomeData:                () => {},
  worldFocus:                 DEFAULT_WORLD_FOCUS,
  setFocus:                   () => {},
  moveTorus:                  () => {},
  setDominantViewport:        () => {},
});

export function DreamSystemProvider({ children }: {children: ReactNode}) {
  const [bothMenusOpen, setBothMenusOpen]       = useState(false);
  const [drEamsOpen,    setDrEamsOpen]           = useState(false);
  const [runtimeCallbacks, setRuntimeCallbacks] = useState<RuntimeCallbacks | null>(null);
  const [barIntent,     setBarIntentState]       = useState<BarIntent>(DEFAULT_BAR_INTENT);
  // Start at 0.9 so the bar rests near the bottom with a visible DreamSpace sliver.
  // DEFAULT_SPLIT_RATIO (1.0) is kept as the snap-point constant used by
  // barInteractions and its tests; this initial value is intentionally different.
  const [splitRatio,    setSplitRatio]           = useState(0.9);
  const [isBarMinimized, setIsBarMinimized]      = useState(false);
  const [homeData,      setHomeData]             = useState<HomeData | null>(null);

  // ── World Focus / Torus Navigation state ─────────────────────────────────
  const [worldFocus, setWorldFocusState] = useState<WorldFocusState>(DEFAULT_WORLD_FOCUS);

  // Bootstrap homeData from Supabase on any authenticated page so both
  // runtime regions are always available regardless of current route.
  // DreamBarDataBridge enriches this with server-fetched posts on /homedream.
  useEffect(() => {
    const boot = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, handle, display_name, avatar_url')
          .eq('id', user.id)
          .single();
        // Only set if DreamBarDataBridge hasn't already pushed richer data
        setHomeData((prev) => prev ?? {
          userId: user.id,
          profile: profile ?? null,
          initialPosts: [],
          isAdmin: false,
        });
      } catch { /* graceful — regions render skeleton if auth unavailable */ }
    };
    void boot();
  }, []);

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

  // ── World Focus handlers ─────────────────────────────────────────────────

  const setFocus = useCallback((
    key: string,
    payload?: unknown,
    viewport?: 'top' | 'bottom',
  ) => {
    setWorldFocusState((prev) => ({
      ...prev,
      focusKey:         key,
      worldSelection:   payload ?? null,
      dominantViewport: viewport ?? prev.dominantViewport,
    }));
  }, []);

  const moveTorus = useCallback((dx: number, dy: number) => {
    setWorldFocusState((prev) => {
      const { x, y } = computeMoveTorus(prev.torusX, prev.torusY, dx, dy);
      return {
        ...prev,
        torusX:        x,
        torusY:        y,
        focusKey:      torusFocusKey(x, y),
        worldSelection: null,
      };
    });
  }, []);

  const setDominantViewport = useCallback((viewport: 'top' | 'bottom') => {
    setWorldFocusState((prev) => ({ ...prev, dominantViewport: viewport }));
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
      barIntent,
      setBarIntent,
      clearBarIntent,
      splitRatio,
      setSplitRatio,
      isBarMinimized,
      setIsBarMinimized,
      homeData,
      setHomeData,
      worldFocus,
      setFocus,
      moveTorus,
      setDominantViewport,
    }}>
      {children}
    </DreamSystemContext.Provider>
  );
}

export const useDreamSystem = () => useContext(DreamSystemContext);
