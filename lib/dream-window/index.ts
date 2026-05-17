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
  DreamWindowInstance,
  DreamWindowSize,
  DreamWindowPosition,
  DreamWindowConfig,
  DestinationRule,
} from './DreamWindowLifecycle';

export {
  DREAM_WINDOW_STATES,
  DREAM_WINDOW_REQUIRED_LAYERS,
  bindDreamWindow,
  mountDreamWindow,
  collapseDreamWindow,
  activateDreamWindow,
  unmountDreamWindow,
  unbindDreamWindow,
  createDreamWindowInstance,
  validateDreamWindowLayers,
} from './DreamWindowLifecycle';

export type {
  DreamWindowState,
  DreamWindowLayer,
  DreamWindowLayerValidationResult,
} from './DreamWindowLifecycle';

// ── Connection verbs ──────────────────────────────────────────────────────────
export type { ConnectionAction, ConnectionResult } from './connectionVerbs';

export {
  dispatch,
  createBindAction,
  createMountAction,
  createActivateAction,
  createAttachAction,
  createRouteIntoAction,
  createOpenIntoAction,
  createConnectAcrossAction,
  CONNECTION_VERBS,
  isValidConnectionVerb,
} from './connectionVerbs';

export type { ConnectionVerb } from './connectionVerbs';

// ── Runtime region ────────────────────────────────────────────────────────────
export type {
  DreamWindowRef,
  SurfaceSpaceState,
  DreamSpaceState,
  SeamState,
  RuntimeRegionState,
} from './runtimeRegion';

export {
  DEFAULT_RUNTIME_REGION_STATE,
  activateSurface,
  mountWindowInDreamSpace,
  dismountWindowFromDreamSpace,
  setSeamPosition,
  getSurfaceSpaceSurface,
  isDreamSpaceDominant,
  RUNTIME_REGIONS,
} from './runtimeRegion';

// ── Engin connection network ──────────────────────────────────────────────────
export type { EnginConnectionPath } from './enginConnectionNetwork';

export {
  ALL_CONNECTION_PATHS,
  getPathsForDomain,
  getPathsForEngin,
  hasConnectionPath,
} from './enginConnectionNetwork';
