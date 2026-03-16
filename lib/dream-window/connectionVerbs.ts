/**
 * connectionVerbs — Canonical connection verb system
 *
 * Validates and dispatches Dream Window / Surface connection actions using
 * the seven canonical verbs defined in lib/identity/canonical-names.ts.
 *
 * Valid verbs:
 *   bind | mount | activate | attach | route into | open into | connect across
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Daydream Surface Network)
 * Naming: docs/NAMING_AUTHORITY.md §7 (Connection language)
 * Law: docs/LAW.md §OS-layer naming law — use canonical verbs only.
 */

import {
  CONNECTION_VERBS,
  REJECTED_CONNECTION_VERBS,
  type ConnectionVerb,
  isValidConnectionVerb,
  isRejectedConnectionVerb,
} from '@/lib/identity/canonical-names';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A fully-typed connection action between two runtime entities.
 */
export interface ConnectionAction {
  /** Canonical connection verb governing this action */
  verb: ConnectionVerb;
  /** ID of the source Dream Window, surface, or runtime entity */
  sourceId: string;
  /** ID of the target Dream Window, surface, or runtime entity */
  targetId: string;
  /**
   * Optional context label — e.g. a surface name, runtime region, or session ID.
   * Helpful for debugging and audit trails.
   */
  context?: string;
}

/**
 * Result returned by `dispatch`.
 */
export interface ConnectionResult {
  /** Whether the action was successfully dispatched */
  ok: boolean;
  /** Human-readable status message */
  message: string;
  /** The original action that was dispatched */
  action: ConnectionAction;
}

// ---------------------------------------------------------------------------
// Core dispatch
// ---------------------------------------------------------------------------

/**
 * Dispatch a connection action.
 *
 * Validates that the verb is a canonical connection verb, then records and
 * returns a result. In a full runtime, this is where connection event buses,
 * analytics, and audit logging would be wired.
 *
 * @throws if `action.verb` is not a valid canonical connection verb — the error
 *         names the rejected verb and lists all valid alternatives.
 *
 * @example
 * const result = dispatch(createBindAction('window-abc', 'starmaker-engin'));
 * // → { ok: true, message: "Connection action 'bind' dispatched: ..." }
 */
export function dispatch(action: ConnectionAction): ConnectionResult {
  if (!isValidConnectionVerb(action.verb)) {
    const isRejected = isRejectedConnectionVerb(action.verb);
    const rejectionHint = isRejected
      ? ` '${action.verb}' is explicitly rejected — use canonical verbs instead.`
      : ` '${action.verb}' is not recognised.`;

    throw new Error(
      `dispatch: invalid connection verb '${action.verb}'.${rejectionHint} ` +
        `Valid canonical verbs are: ${CONNECTION_VERBS.join(', ')}.`,
    );
  }

  const contextNote = action.context ? ` [context: ${action.context}]` : '';

  return {
    ok: true,
    message:
      `Connection action '${action.verb}' dispatched: ` +
      `'${action.sourceId}' → '${action.targetId}'${contextNote}.`,
    action,
  };
}

// ---------------------------------------------------------------------------
// Action factory helper
// ---------------------------------------------------------------------------

function buildAction(
  verb: ConnectionVerb,
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return { verb, sourceId, targetId, ...(context !== undefined ? { context } : {}) };
}

// ---------------------------------------------------------------------------
// Action factories — one per canonical verb
// ---------------------------------------------------------------------------

/**
 * Create a `bind` ConnectionAction.
 *
 * Use when attaching a Dream Window or surface to a source provider or engin
 * for the first time. This is the foundational attachment verb.
 *
 * @example
 * dispatch(createBindAction('music-window-1', 'starmaker-engin'));
 */
export function createBindAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('bind', sourceId, targetId, context);
}

/**
 * Create a `mount` ConnectionAction.
 *
 * Use when activating a bound Dream Window into the visible DreamSpace region.
 *
 * @example
 * dispatch(createMountAction('music-window-1', 'dreamspace'));
 */
export function createMountAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('mount', sourceId, targetId, context);
}

/**
 * Create an `activate` ConnectionAction.
 *
 * Use when re-expanding a collapsed Dream Window or bringing a surface
 * to foreground focus.
 *
 * @example
 * dispatch(createActivateAction('music-window-1', 'surface-space'));
 */
export function createActivateAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('activate', sourceId, targetId, context);
}

/**
 * Create an `attach` ConnectionAction.
 *
 * Use when linking a supplementary provider or capability to an existing
 * Dream Window without full binding semantics.
 *
 * @example
 * dispatch(createAttachAction('spotify-connector', 'music-window-1'));
 */
export function createAttachAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('attach', sourceId, targetId, context);
}

/**
 * Create a `route into` ConnectionAction.
 *
 * Use when directing output or data from one surface into another as an
 * input channel (cross-surface data routing).
 *
 * @example
 * dispatch(createRouteIntoAction('music-daydream', 'lab-engin'));
 */
export function createRouteIntoAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('route into', sourceId, targetId, context);
}

/**
 * Create an `open into` ConnectionAction.
 *
 * Use when expanding a surface or Dream Window into a new runtime region —
 * the canonical alternative to "open page" or "navigate to tab".
 *
 * @example
 * dispatch(createOpenIntoAction('brand-window', 'dreamspace'));
 */
export function createOpenIntoAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('open into', sourceId, targetId, context);
}

/**
 * Create a `connect across` ConnectionAction.
 *
 * Use when establishing a bidirectional cross-surface connection — i.e.
 * sharing capabilities or state between two independent runtime surfaces.
 *
 * @example
 * dispatch(createConnectAcrossAction('music-daydream', 'code-engin'));
 */
export function createConnectAcrossAction(
  sourceId: string,
  targetId: string,
  context?: string,
): ConnectionAction {
  return buildAction('connect across', sourceId, targetId, context);
}

// Re-export canonical constants for consumers who import only from this module.
export { CONNECTION_VERBS, REJECTED_CONNECTION_VERBS, isValidConnectionVerb };
export type { ConnectionVerb };
