/**
 * Dual Runtime System
 *
 * DREAMengin is a dual-runtime, spatial operating environment with two
 * independent runtime regions:
 *
 *   - Surface Space  (upper region — hosts active surfaces)
 *   - DreamSpace     (lower region — hosts Dream Windows + launcher)
 *
 * Either region can display any world. Both regions are independent views
 * into the same runtime — they can show the same world or different worlds.
 *
 * Valid state examples:
 *   - HomeDream Surface / DreamSpace
 *   - HomeDream Surface / HomeDream Surface (two independent Home views)
 *   - DreamSpace / DreamSpace (two DreamSpace views)
 *   - View Profile Surface / DreamSpace
 *   - any combination of RuntimeWorld values
 *
 * Naming: All canonical string values imported from lib/identity/canonical-names.ts.
 * Architecture: docs/ARCHITECTURE.md §1 (Runtime regions)
 * Law: docs/LAW.md §OS-layer naming law
 */

import {
  SURFACE_NAMES,
  RUNTIME_REGIONS,
} from '@/lib/identity/canonical-names';
import type { SystemPanelId } from '@/lib/panels/panelTypes';

// ---------------------------------------------------------------------------
// RuntimeWorld — canonical string literals + object variants
// ---------------------------------------------------------------------------

/**
 * A RuntimeWorld value identifies what a runtime region is currently showing.
 *
 * String literals use canonical surface names from SURFACE_NAMES / RUNTIME_REGIONS.
 * Object variants carry typed payloads for Dream, Engin, panel, and custom worlds.
 *
 * panel worlds load a system feature (Settings, Connectors, etc.) directly
 * into the region — no routing, no overlays, no navigation.
 */
export type RuntimeWorld =
  | typeof SURFACE_NAMES.HOME_DREAM_SURFACE      // 'HomeDream Surface'
  | typeof SURFACE_NAMES.VIEW_PROFILE_SURFACE    // 'View Profile Surface'
  | typeof RUNTIME_REGIONS.DREAM_SPACE           // 'DreamSpace'
  | { type: 'dream'; id: string }
  | { type: 'engin'; name: string }
  | { type: 'panel'; name: SystemPanelId }       // in-region feature panel
  | { type: 'custom'; path: string };

// ---------------------------------------------------------------------------
// DualRuntimeState
// ---------------------------------------------------------------------------

export interface DualRuntimeState {
  /** The world currently shown in the Surface Space region (upper) */
  surfaceSpaceWorld: RuntimeWorld;
  /** The world currently shown in the DreamSpace region (lower) */
  dreamSpaceWorld: RuntimeWorld;
  /**
   * Which region is currently dominant / primary-visible.
   * Controlled by the DreamDM Bar drag position.
   * Uses canonical runtime region names: 'Surface Space' | 'DreamSpace'.
   */
  dominantRegion: 'Surface Space' | 'DreamSpace';
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

export const DEFAULT_DUAL_RUNTIME: DualRuntimeState = {
  surfaceSpaceWorld: SURFACE_NAMES.HOME_DREAM_SURFACE,
  dreamSpaceWorld:   RUNTIME_REGIONS.DREAM_SPACE,
  dominantRegion:    RUNTIME_REGIONS.SURFACE_SPACE,
};

// ---------------------------------------------------------------------------
// Pure state transition functions
// ---------------------------------------------------------------------------

/**
 * Set the world shown in a specific runtime region.
 *
 * @param runtime - 'top' targets surfaceSpaceWorld; 'bottom' targets dreamSpaceWorld.
 */
export function setRuntimeWorld(
  state: DualRuntimeState,
  runtime: 'top' | 'bottom',
  world: RuntimeWorld,
): DualRuntimeState {
  return {
    ...state,
    [runtime === 'top' ? 'surfaceSpaceWorld' : 'dreamSpaceWorld']: world,
  };
}

/**
 * Swap which region is dominant.
 * Controlled by DreamDM Bar drag — toggles Surface Space ↔ DreamSpace dominance.
 */
export function swapDominantRuntime(state: DualRuntimeState: DualRuntimeState {
  return {
    ...state,
    dominantRegion:
      state.dominantRegion === RUNTIME_REGIONS.SURFACE_SPACE
        ? RUNTIME_REGIONS.DREAM_SPACE
        : RUNTIME_REGIONS.SURFACE_SPACE,
  };
}

/**
 * Make HomeDream Surface the active world in Surface Space and set it dominant.
 * Used when the user double-taps the Gold button to return home.
 */
export function makeHomeActiveTop(state: DualRuntimeState: DualRuntimeState {
  return {
    ...state,
    surfaceSpaceWorld: SURFACE_NAMES.HOME_DREAM_SURFACE,
    dominantRegion:    RUNTIME_REGIONS.SURFACE_SPACE,
  };
}

/**
 * Load HomeDream Surface into the DreamSpace region and make it dominant.
 *
 * Used when the user double-taps the Gold button while the DreamDM Bar is
 * locked at the top — gives the user two independent HomeDream views
 * simultaneously (one in Surface Space, one in DreamSpace).
 */
export function makeHomeDreamSpaceActive(state: DualRuntimeState: DualRuntimeState {
  return {
    ...state,
    dreamSpaceWorld: SURFACE_NAMES.HOME_DREAM_SURFACE,
    dominantRegion:  RUNTIME_REGIONS.DREAM_SPACE,
  };
}

/**
 * Load the DreamSpace world into the Surface Space region and make it dominant.
 *
 * This unifies access to DreamSpace — either region can show the DreamSpace
 * world (DreamsSpacePanel). With this function, Surface Space shows the
 * DreamSpace world while DreamSpace region continues to show its own world,
 * allowing two independent DreamSpace sessions simultaneously (e.g. two
 * Daydreams or Engins open at the same time).
 */
export function makeDreamSpaceActiveSurface(state: DualRuntimeState: DualRuntimeState {
  return {
    ...state,
    surfaceSpaceWorld: RUNTIME_REGIONS.DREAM_SPACE,
    dominantRegion:    RUNTIME_REGIONS.SURFACE_SPACE,
  };
}

/**
 * Check if HomeDream Surface is currently the active world in Surface Space
 * and Surface Space is the dominant region.
 */
export function isHomeActiveTop(state: DualRuntimeState: boolean {
  return (
    state.surfaceSpaceWorld === SURFACE_NAMES.HOME_DREAM_SURFACE &&
    state.dominantRegion === RUNTIME_REGIONS.SURFACE_SPACE
  );
}

/**
 * Check if two RuntimeWorld values are structurally equal.
 */
export function worldsEqual(a: RuntimeWorld, b: RuntimeWorld: boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    if (a.type !== b.type) return false;
    if (a.type === 'dream' && b.type === 'dream') return a.id === b.id;
    if (a.type === 'engin' && b.type === 'engin') return a.name === b.name;
    if (a.type === 'custom' && b.type === 'custom') return a.path === b.path;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Torus world map — the "one page / wrap-around navigation" model
// ---------------------------------------------------------------------------

/**
 * The DREAMengin world is modelled as a torus: a 2-D grid that wraps in both
 * axes. Navigating left/right moves through domains; navigating up/down moves
 * between Surface mode (y=0) and Engin mode (y=1).
 *
 * Each (x, y) cell maps to a focusKey that drives what both viewports show.
 *
 *   x  Domain     y=0 (surface)        y=1 (engin)
 *   0  home        home                 home
 *   1  dreamr      dreamr.feed          dreamr.channel
 *   2  games       games.library        games.play
 *   3  music       music.surface        music.engin
 *   4  code        code.surface         code.engin
 *   5  brand       brand.surface        brand.engin
 */
export const TORUS_DOMAINS = ['home', 'dreamr', 'games', 'music', 'code', 'brand'] as const;
export type TorusDomain = (typeof TORUS_DOMAINS)[number];

export const TORUS_WIDTH  = TORUS_DOMAINS.length; // wraps on X
export const TORUS_HEIGHT = 2;                     // wraps on Y (0=surface, 1=engin)

/** Map from (domain, y) → focusKey */
export const TORUS_FOCUS_MAP: Record<TorusDomain, [surface: string, engin: string]> = {
  home:   ['home',             'home'],
  dreamr: ['dreamr.feed',      'dreamr.channel'],
  games:  ['games.library',    'games.play'],
  music:  ['music.surface',    'music.engin'],
  code:   ['code.surface',     'code.engin'],
  brand:  ['brand.surface',    'brand.engin'],
};

/** Compute the focusKey for a given torus position */
export function torusFocusKey(x: number, y: number: string {
  // The modulo + addition guards against negative x values from moveTorus.
  // TORUS_DOMAINS is a fixed-length const tuple so the index is always valid,
  // but we default to 'home' to stay defensive against future array changes.
  const domain = TORUS_DOMAINS[((x % TORUS_WIDTH) + TORUS_WIDTH) % TORUS_WIDTH] ?? 'home';
  const pair = TORUS_FOCUS_MAP[domain as keyof typeof TORUS_FOCUS_MAP] ?? TORUS_FOCUS_MAP.home;
  return y === 0 ? pair[0] : pair[1];
}

/** Move a torus coordinate by (dx, dy) with wrap-around */
export function moveTorus(
  x: number,
  y: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const nx = ((x + dx) % TORUS_WIDTH  + TORUS_WIDTH)  % TORUS_WIDTH;
  const ny = ((y + dy) % TORUS_HEIGHT + TORUS_HEIGHT) % TORUS_HEIGHT;
  return { x: nx, y: ny };
}

// Re-export canonical name constants for consumers
export { SURFACE_NAMES, RUNTIME_REGIONS };
