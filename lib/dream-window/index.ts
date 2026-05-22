/**
 * lib/dream-window — Phase 7 Dream Window + Runtime System
 *
 * Single barrel export for the complete Dream Window system logic:
 *
 *   DreamWindowLifecycle  — state machine (Unbound → Bound → Mounted → Collapsed)
 *   connectionVerbs       — canonical connection verb dispatch
 *   runtimeRegion         — dual-runtime spatial model (Surface Space / DreamSpace)
 *   enginConnectionNetwork — 11-path multi-surface Engin connection network
 *
 * Usage:
 *   import { DreamWindowInstance, bindDreamWindow, mountDreamWindow } from '@/lib/dream-window';
 *   import { dispatch, createBindAction } from '@/lib/dream-window';
 *   import { DEFAULT_RUNTIME_REGION_STATE, activateSurface } from '@/lib/dream-window';
 *   import { ALL_CONNECTION_PATHS, getPathsForDomain } from '@/lib/dream-window';
 *
 * Architecture: docs/ARCHITECTURE.md §4
 * Naming authority: lib/identity/canonical-names.ts
 */

// ── Dream Window lifecycle ────────────────────────────────────────────────────
export type {
    DestinationRule, DreamWindowConfig, DreamWindowInstance, DreamWindowPosition, DreamWindowSize
} from './DreamWindowLifecycle';

export {
    DREAM_WINDOW_REQUIRED_LAYERS, DREAM_WINDOW_STATES, activateDreamWindow, bindDreamWindow, collapseDreamWindow, createDreamWindowInstance, mountDreamWindow, unbindDreamWindow, unmountDreamWindow, validateDreamWindowLayers
} from './DreamWindowLifecycle';

export type {
    DreamWindowLayer,
    DreamWindowLayerValidationResult, DreamWindowState
} from './DreamWindowLifecycle';

// ── Connection verbs ──────────────────────────────────────────────────────────
export type { ConnectionAction, ConnectionResult } from './connectionVerbs';

export {
    CONNECTION_VERBS, createActivateAction,
    createAttachAction, createBindAction, createConnectAcrossAction, createMountAction, createOpenIntoAction, createRouteIntoAction, dispatch, isValidConnectionVerb
} from './connectionVerbs';

export type { ConnectionVerb } from './connectionVerbs';

// ── Runtime region ────────────────────────────────────────────────────────────
export type {
    DreamSpaceState, DreamWindowRef, RuntimeRegionState, SeamState, SurfaceSpaceState
} from './runtimeRegion';

export {
    DEFAULT_RUNTIME_REGION_STATE, RUNTIME_REGIONS, activateSurface, dismountWindowFromDreamSpace, getSurfaceSpaceSurface,
    isDreamSpaceDominant, mountWindowInDreamSpace, setSeamPosition
} from './runtimeRegion';

// ── Engin connection network ──────────────────────────────────────────────────
export type { EnginConnectionPath } from './enginConnectionNetwork';

export {
    ALL_CONNECTION_PATHS,
    getPathsForDomain,
    getPathsForEngin,
    hasConnectionPath
} from './enginConnectionNetwork';
