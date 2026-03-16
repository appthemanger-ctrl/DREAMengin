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

// ---------------------------------------------------------------------------
// RuntimeWorld — canonical string literals + object variants
// ---------------------------------------------------------------------------

/**
 * A RuntimeWorld value identifies what a runtime region is currently showing.
 *
 * String literals use canonical surface names from SURFACE_NAMES / RUNTIME_REGIONS.
 * Object variants carry typed payloads for Dream, Engin, and custom worlds.
 */
export type RuntimeWorld =
  | typeof SURFACE_NAMES.HOME_DREAM_SURFACE      // 'HomeDream Surface'
  | typeof SURFACE_NAMES.VIEW_PROFILE_SURFACE    // 'View Profile Surface'
  | typeof RUNTIME_REGIONS.DREAM_SPACE           // 'DreamSpace'
  | { type: 'dream'; id: string }
  | { type: 'engin'; name: string }
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
export function swapDominantRuntime(state: DualRuntimeState): DualRuntimeState {
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
export function makeHomeActiveTop(state: DualRuntimeState): DualRuntimeState {
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
export function makeHomeDreamSpaceActive(state: DualRuntimeState): DualRuntimeState {
  return {
    ...state,
    dreamSpaceWorld: SURFACE_NAMES.HOME_DREAM_SURFACE,
    dominantRegion:  RUNTIME_REGIONS.DREAM_SPACE,
  };
}

/**
 * Check if HomeDream Surface is currently the active world in Surface Space
 * and Surface Space is the dominant region.
 */
export function isHomeActiveTop(state: DualRuntimeState): boolean {
  return (
    state.surfaceSpaceWorld === SURFACE_NAMES.HOME_DREAM_SURFACE &&
    state.dominantRegion === RUNTIME_REGIONS.SURFACE_SPACE
  );
}

/**
 * Check if two RuntimeWorld values are structurally equal.
 */
export function worldsEqual(a: RuntimeWorld, b: RuntimeWorld): boolean {
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

// Re-export canonical name constants for consumers
export { SURFACE_NAMES, RUNTIME_REGIONS };
