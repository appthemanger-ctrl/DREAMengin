/**
 * DreamWindowLifecycle — Dream Window state machine
 *
 * Implements the canonical four-state lifecycle for every Dream Window
 * (modular runtime container) using canonical state names from
 * lib/identity/canonical-names.ts.
 *
 * State graph:
 *
 *   Unbound Dream Window
 *      │ bindDreamWindow   (requires sourceBindings to be non-empty)
 *      ▼
 *   Bound Dream Window
 *      │ mountDreamWindow        │ unbindDreamWindow
 *      ▼                         ▲
 *   Mounted Dream Window
 *      │ collapseDreamWindow     │ unmountDreamWindow
 *      │ activateDreamWindow (↑) │
 *      ▼
 *   Collapsed Dream Window
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Privacy: visibility defaults to 'private' — nothing is public by default
 *          per docs/AXIOMS.md §product integrity rules.
 * Naming: All state strings sourced from DREAM_WINDOW_STATES (canonical-names.ts).
 */

import {
  DREAM_WINDOW_STATES,
  type DreamWindowState,
  type ConnectionVerb,
} from '@/lib/identity/canonical-names';

// ---------------------------------------------------------------------------
// Dream Window instance type
// ---------------------------------------------------------------------------

export interface DreamWindowSize {
  width: number;
  height: number;
}

export interface DreamWindowPosition {
  x: number;
  y: number;
}

export interface DreamWindowConfig {
  /** Human-readable label for this Dream Window */
  label: string;
  /** Additional configuration specific to the window type */
  [key: string]: unknown;
}

export interface DestinationRule {
  /** Target surface or region this window may project output into */
  targetSurface: string;
  /** Canonical verb governing the connection */
  verb: ConnectionVerb;
}

/**
 * A fully-typed Dream Window instance.
 *
 * Every field listed in DREAM_WINDOW_REQUIRED_FIELDS is represented here.
 * `visibility` starts 'private' — explicit user intent is required before
 * any transition to 'shared' or 'public'.
 */
export interface DreamWindowInstance {
  /** Unique identifier for this Dream Window instance */
  id: string;
  /** Category / type label (e.g. 'music', 'code', 'brand') */
  type: string;
  /** Owner user ID — every Dream Window is owned by exactly one user */
  owner: string;
  /** Configuration bag — label, display options, runtime-specific settings */
  config: DreamWindowConfig;
  /** Current rendered size */
  size: DreamWindowSize;
  /** Current position in the DreamSpace layout grid */
  position: DreamWindowPosition;
  /**
   * Visibility level — private by default (docs/AXIOMS.md §product integrity rules).
   * 'private'  = visible only to owner
   * 'shared'   = visible to specific users/groups chosen by owner
   * 'public'   = visible to anyone
   */
  visibility: 'private' | 'shared' | 'public';
  /**
   * Source provider binding IDs attached to this Dream Window.
   * Must be non-empty before the window can be bound (bindDreamWindow).
   */
  sourceBindings: string[];
  /** Rules that govern where this window may project its output */
  destinationRules: DestinationRule[];
  /** Current lifecycle state (canonical DREAM_WINDOW_STATES value) */
  activeState: DreamWindowState;
}

// ---------------------------------------------------------------------------
// Transition helpers
// ---------------------------------------------------------------------------

function assertState(
  instance: DreamWindowInstance,
  expected: DreamWindowState,
  fnName: string,
): void {
  if (instance.activeState !== expected) {
    throw new Error(
      `${fnName}: invalid transition from '${instance.activeState}'. ` +
        `Expected '${expected}'. ` +
        `Dream Window '${instance.id}' must be in ${expected} state first.`,
    );
  }
}

// ---------------------------------------------------------------------------
// State machine transitions
// ---------------------------------------------------------------------------

/**
 * Bind a Dream Window.
 * Transition: `Unbound Dream Window` → `Bound Dream Window`
 *
 * Requirements:
 * - Instance must be in `Unbound Dream Window` state.
 * - `sourceBindings` must contain at least one entry — a Dream Window cannot
 *   be bound into the runtime without a source provider attached.
 *
 * @throws if called from any state other than 'Unbound Dream Window'
 * @throws if `sourceBindings` is empty
 */
export function bindDreamWindow(instance: DreamWindowInstance): DreamWindowInstance {
  assertState(instance, DREAM_WINDOW_STATES.UNBOUND, 'bindDreamWindow');

  if (instance.sourceBindings.length === 0) {
    throw new Error(
      `bindDreamWindow: cannot bind Dream Window '${instance.id}' — ` +
        `sourceBindings must be non-empty. Attach at least one source provider ` +
        `before calling bindDreamWindow.`,
    );
  }

  return { ...instance, activeState: DREAM_WINDOW_STATES.BOUND };
}

/**
 * Mount a Dream Window.
 * Transition: `Bound Dream Window` → `Mounted Dream Window`
 *
 * Activates the Dream Window into the visible DreamSpace region.
 *
 * @throws if called from any state other than 'Bound Dream Window'
 */
export function mountDreamWindow(instance: DreamWindowInstance): DreamWindowInstance {
  assertState(instance, DREAM_WINDOW_STATES.BOUND, 'mountDreamWindow');
  return { ...instance, activeState: DREAM_WINDOW_STATES.MOUNTED };
}

/**
 * Collapse a Dream Window.
 * Transition: `Mounted Dream Window` → `Collapsed Dream Window`
 *
 * The window remains in DreamSpace but is minimized / dormant.
 * It retains its bindings and can be re-activated without re-binding.
 *
 * @throws if called from any state other than 'Mounted Dream Window'
 */
export function collapseDreamWindow(instance: DreamWindowInstance): DreamWindowInstance {
  assertState(instance, DREAM_WINDOW_STATES.MOUNTED, 'collapseDreamWindow');
  return { ...instance, activeState: DREAM_WINDOW_STATES.COLLAPSED };
}

/**
 * Activate a Dream Window.
 * Transition: `Collapsed Dream Window` → `Mounted Dream Window`
 *
 * Re-expands a collapsed window back into the active DreamSpace view.
 *
 * @throws if called from any state other than 'Collapsed Dream Window'
 */
export function activateDreamWindow(instance: DreamWindowInstance): DreamWindowInstance {
  assertState(instance, DREAM_WINDOW_STATES.COLLAPSED, 'activateDreamWindow');
  return { ...instance, activeState: DREAM_WINDOW_STATES.MOUNTED };
}

/**
 * Unmount a Dream Window.
 * Transition: `Mounted Dream Window` → `Bound Dream Window`
 *
 * Removes the window from the active DreamSpace view while keeping it bound
 * to its source provider. Can be re-mounted without re-binding.
 *
 * @throws if called from any state other than 'Mounted Dream Window'
 */
export function unmountDreamWindow(instance: DreamWindowInstance): DreamWindowInstance {
  assertState(instance, DREAM_WINDOW_STATES.MOUNTED, 'unmountDreamWindow');
  return { ...instance, activeState: DREAM_WINDOW_STATES.BOUND };
}

/**
 * Unbind a Dream Window.
 * Transition: `Bound Dream Window` → `Unbound Dream Window`
 *
 * Fully detaches the window from the runtime. All source bindings are severed.
 * The window retains its config and owner but must be re-bound before use.
 *
 * @throws if called from any state other than 'Bound Dream Window'
 */
export function unbindDreamWindow(instance: DreamWindowInstance): DreamWindowInstance {
  assertState(instance, DREAM_WINDOW_STATES.BOUND, 'unbindDreamWindow');
  return { ...instance, activeState: DREAM_WINDOW_STATES.UNBOUND };
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

/**
 * Create a new Dream Window instance in the Unbound state.
 * `visibility` defaults to 'private' — explicit user intent is required to
 * change it (docs/AXIOMS.md §product integrity rules).
 */
export function createDreamWindowInstance(
  params: Omit<DreamWindowInstance, 'activeState' | 'visibility'> & {
    visibility?: DreamWindowInstance['visibility'];
  },
): DreamWindowInstance {
  return {
    ...params,
    visibility: params.visibility ?? 'private',
    activeState: DREAM_WINDOW_STATES.UNBOUND,
  };
}

// ---------------------------------------------------------------------------
// Layer validation — Point 20 (Shell→Connector→Feature→Output enforcement)
// ---------------------------------------------------------------------------

/**
 * The four canonical layers that every Dream Window must pass through.
 * Defined as a readonly tuple to guarantee ordering.
 */
export const DREAM_WINDOW_REQUIRED_LAYERS = [
  'DreamShell',
  'DreamConnectorLayer',
  'DreamFeatureLayer',
  'DreamOutputLayer',
] as const;

export type DreamWindowLayer = (typeof DREAM_WINDOW_REQUIRED_LAYERS)[number];

/**
 * Validation result from `validateDreamWindowLayers`.
 */
export interface DreamWindowLayerValidationResult {
  valid: boolean;
  missingLayers: DreamWindowLayer[];
  /** Human-readable error message, or null if valid */
  error: string | null;
}

/**
 * Validate that a Dream Window instance passes through all four required
 * layers: DreamShell → DreamConnectorLayer → DreamFeatureLayer → DreamOutputLayer.
 *
 * This is called from the API layer on every mount operation (Points 16 & 20).
 * A Dream Window that skips any layer is rejected before state transition.
 *
 * The `presentLayers` field in config records which layers are present.
 * If not supplied, this validator checks `config.layers` array.
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 *
 * @param instance  The Dream Window instance to validate
 * @returns         Validation result with missing-layer details on failure
 */
export function validateDreamWindowLayers(
  instance: DreamWindowInstance,
): DreamWindowLayerValidationResult {
  // Read the layers list from config — expects config.layers: string[]
  const configLayers = Array.isArray((instance.config as Record<string, unknown>).layers)
    ? ((instance.config as Record<string, unknown>).layers as string[])
    : [];

  const missingLayers = DREAM_WINDOW_REQUIRED_LAYERS.filter(
    (layer) => !configLayers.includes(layer),
  );

  if (missingLayers.length === 0) {
    return { valid: true, missingLayers: [], error: null };
  }

  return {
    valid: false,
    missingLayers,
    error:
      `Dream Window '${instance.id}' is missing required layers: ` +
      missingLayers.join(', ') +
      `. Every Dream Window must pass through all four layers: ` +
      DREAM_WINDOW_REQUIRED_LAYERS.join(' → ') +
      `.`,
  };
}

// Re-export canonical constants so consumers can use this module as a single
// import point for Dream Window lifecycle work.
export { DREAM_WINDOW_STATES };
export type { DreamWindowState };

