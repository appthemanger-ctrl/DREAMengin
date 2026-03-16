/**
 * runtimeRegion — Dual-runtime spatial model
 *
 * Implements the canonical two-region + seam spatial layout of DREAMengin's
 * dual-runtime operating environment using canonical names from
 * lib/identity/canonical-names.ts.
 *
 * Regions:
 *   ┌──────────────────────────────────────┐
 *   │          Surface Space               │  ← hosts active surfaces
 *   │  (HomeDream, Daydreams, Engins …)   │
 *   ├──────── DreamDM Bar / Seam ──────────┤  ← Runtime Seam
 *   │          DreamSpace                  │  ← hosts Dream Windows + launcher
 *   └──────────────────────────────────────┘
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Runtime regions)
 * Naming: docs/NAMING_AUTHORITY.md §6 (OS-layer naming)
 * Law: docs/LAW.md §OS-layer naming law
 */

import {
  RUNTIME_REGIONS,
  SURFACE_NAMES,
  type RuntimeSeamName,
  type DreamWindowState,
} from '@/lib/identity/canonical-names';

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

/**
 * A lightweight reference to a Dream Window currently mounted in DreamSpace.
 */
export interface DreamWindowRef {
  /** Unique Dream Window instance ID */
  id: string;
  /** Current lifecycle state of this Dream Window */
  activeState: DreamWindowState;
}

/**
 * State of the Surface Space region (upper runtime region).
 * Hosts the currently active surface — HomeDream, Daydreams, Engins, etc.
 */
export interface SurfaceSpaceState {
  /** Canonical name of the currently active surface */
  activeSurface: string;
  /** Canonical region label — always 'Surface Space' */
  region: 'Surface Space';
  /** Whether Surface Space is the dominant (primary visible) region */
  isDominant: boolean;
}

/**
 * State of the DreamSpace region (lower runtime region).
 * Hosts all mounted Dream Windows and the Dreams launcher.
 */
export interface DreamSpaceState {
  /** All Dream Windows currently mounted in this region */
  mountedWindows: DreamWindowRef[];
  /** Canonical region label — always 'DreamSpace' */
  region: 'DreamSpace';
  /** Whether DreamSpace is the dominant (primary visible) region */
  isDominant: boolean;
}

/**
 * State of the Runtime Seam — the DreamDM Bar / Persistent Interaction Rail
 * that divides Surface Space from DreamSpace.
 */
export interface SeamState {
  /**
   * Seam position as a fraction 0–1.
   * 0 = Surface Space fully visible (seam at bottom)
   * 1 = DreamSpace fully visible (seam at top)
   */
  position: number;
  /** Canonical seam label */
  label: RuntimeSeamName;
}

/**
 * Full runtime region state snapshot.
 * Represents the complete spatial layout at any point in time.
 */
export interface RuntimeRegionState {
  surfaceSpace: SurfaceSpaceState;
  dreamSpace: DreamSpaceState;
  seam: SeamState;
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

/**
 * The default runtime region state:
 * - Surface Space is dominant, showing HomeDream Surface
 * - DreamSpace has no mounted windows
 * - Seam is at position 0 (bar at bottom), labelled 'DreamDM Bar'
 */
export const DEFAULT_RUNTIME_REGION_STATE: RuntimeRegionState = {
  surfaceSpace: {
    activeSurface: SURFACE_NAMES.HOME_DREAM_SURFACE,
    region: RUNTIME_REGIONS.SURFACE_SPACE,
    isDominant: true,
  },
  dreamSpace: {
    mountedWindows: [],
    region: RUNTIME_REGIONS.DREAM_SPACE,
    isDominant: false,
  },
  seam: {
    position: 0,
    label: 'DreamDM Bar',
  },
};

// ---------------------------------------------------------------------------
// State transitions (pure functions — return new state, never mutate)
// ---------------------------------------------------------------------------

/**
 * Set the active surface in Surface Space.
 *
 * Use canonical surface names from SURFACE_NAMES (canonical-names.ts).
 *
 * @example
 * const next = activateSurface(state, SURFACE_NAMES.MUSIC_DAYDREAM_SURFACE);
 */
export function activateSurface(
  state: RuntimeRegionState,
  surfaceName: string,
): RuntimeRegionState {
  return {
    ...state,
    surfaceSpace: {
      ...state.surfaceSpace,
      activeSurface: surfaceName,
    },
  };
}

/**
 * Add a Dream Window ref to DreamSpace.
 *
 * If a window with the same ID is already mounted, it is replaced with the
 * updated ref to prevent duplicates.
 *
 * @example
 * const next = mountWindowInDreamSpace(state, { id: 'win-1', activeState: DREAM_WINDOW_STATES.MOUNTED });
 */
export function mountWindowInDreamSpace(
  state: RuntimeRegionState,
  ref: DreamWindowRef,
): RuntimeRegionState {
  const existing = state.dreamSpace.mountedWindows.filter((w) => w.id !== ref.id);
  return {
    ...state,
    dreamSpace: {
      ...state.dreamSpace,
      mountedWindows: [...existing, ref],
    },
  };
}

/**
 * Remove a Dream Window ref from DreamSpace by id.
 *
 * If no window with that ID is mounted, the state is returned unchanged.
 *
 * @example
 * const next = dismountWindowFromDreamSpace(state, 'win-1');
 */
export function dismountWindowFromDreamSpace(
  state: RuntimeRegionState,
  id: string,
): RuntimeRegionState {
  return {
    ...state,
    dreamSpace: {
      ...state.dreamSpace,
      mountedWindows: state.dreamSpace.mountedWindows.filter((w) => w.id !== id),
    },
  };
}

/**
 * Update the seam position (0–1 range, clamped).
 *
 * Automatically updates the `isDominant` flag on both regions:
 * - position < 0.5 → Surface Space is dominant
 * - position ≥ 0.5 → DreamSpace is dominant
 *
 * @param position - target position (will be clamped to [0, 1])
 *
 * @example
 * const next = setSeamPosition(state, 0.8); // DreamSpace becomes dominant
 */
export function setSeamPosition(
  state: RuntimeRegionState,
  position: number,
): RuntimeRegionState {
  const clamped = Math.min(1, Math.max(0, position));
  const dreamIsDominant = clamped >= 0.5;

  return {
    ...state,
    seam: { ...state.seam, position: clamped },
    surfaceSpace: { ...state.surfaceSpace, isDominant: !dreamIsDominant },
    dreamSpace: { ...state.dreamSpace, isDominant: dreamIsDominant },
  };
}

/**
 * Returns the current active surface name in Surface Space.
 *
 * @example
 * const surface = getSurfaceSpaceSurface(state);
 * // → 'HomeDream Surface'
 */
export function getSurfaceSpaceSurface(state: RuntimeRegionState): string {
  return state.surfaceSpace.activeSurface;
}

/**
 * Returns whether DreamSpace is currently the dominant region.
 *
 * @example
 * if (isDreamSpaceDominant(state)) { ... }
 */
export function isDreamSpaceDominant(state: RuntimeRegionState): boolean {
  return state.dreamSpace.isDominant;
}

// Re-export canonical constants
export { RUNTIME_REGIONS };
