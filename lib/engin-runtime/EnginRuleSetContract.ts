/**
 * lib/engin-runtime/EnginRuleSetContract.ts
 *
 * EnginRuleSetContract — the interface every rule-set must implement.
 *
 * A rule-set is a PURE, STATELESS collection of:
 *   - parameters  : static configuration (layout, accent, names, etc.)
 *   - constraints : validation functions applied to actions before they execute
 *   - transforms  : (state, action) → state — the only way state changes
 *
 * Rule-sets contain ZERO infrastructure (no fetch, no I/O, no hooks).
 * All effects are handled by the EnginRuntime.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Ruleset.
 */

import type { EnginBaseState } from './EnginBaseState';
import type { EnginCapability } from './EnginCapabilities';

// --- Actions -----------------------------------------------------------------

/** Discriminated union describing every action a rule-set can handle. */
export interface EnginAction<Type extends string = string, Payload = unknown> {
  type: Type;
  payload?: Payload;
}

// --- Rule-set parameters ------------------------------------------------------

export interface EnginRuleSetParams {
  /** Canonical engine identifier. Must match the shell EngineId. */
  enginId: string;
  /** Display name (e.g. "GameEngin"). */
  name: string;
  /** Layout mode — immersive (full canvas) or standard (panelled). */
  layoutMode: 'immersive' | 'standard';
  /** CSS hex accent color. */
  accentColor: string;
  /** Any additional static config the rule-set needs. */
  [key: string]: unknown;
}

// --- Constraint ---------------------------------------------------------------

export interface ConstraintResult {
  valid: boolean;
  /** Populated when valid === false. */
  reason?: string;
}

/** A constraint function: returns valid or invalid + reason. */
export type EnginConstraint<A extends EnginAction = EnginAction> = (
  state: EnginBaseState,
  action: A,
) => ConstraintResult;

// --- Transform ----------------------------------------------------------------

/**
 * A transform function: pure mapping from current state + action to next state.
 * MUST NOT cause side-effects.
 */
export type EnginTransform<A extends EnginAction = EnginAction> = (
  state: EnginBaseState,
  action: A,
) => EnginBaseState;

// --- Rule-set contract --------------------------------------------------------

/**
 * EnginRuleSetContract<A>
 *
 * A rule-set is the ONLY thing that knows about domain logic.
 * It never imports infrastructure (Supabase, fetch, localStorage).
 *
 * @template A — the union of all action types this rule-set handles.
 */
export interface EnginRuleSetContract<A extends EnginAction = EnginAction> {
  /** Static parameters for this rule-set. */
  readonly params: EnginRuleSetParams;

  /**
   * Capabilities required for this rule-set to operate correctly.
   * The engine will warn if these capabilities are not granted.
   */
  readonly requiredCapabilities: ReadonlyArray<EnginCapability>;

  /**
   * constraints
   *
   * Called before every transform.  If any constraint returns invalid,
   * the action is rejected and the state is NOT updated.
   */
  readonly constraints: ReadonlyArray<EnginConstraint<A>>;

  /**
   * transform(state, action) → nextState
   *
   * Applies the action to the current state and returns a new state.
   * The default implementation returns state unchanged (identity).
   */
  transform(state: EnginBaseState, action: A): EnginBaseState;

  /**
   * deriveState(state) → domain-specific derived object
   *
   * Projects the base state into whatever shape the UI needs.
   * Called by the engine whenever state changes.
   */
  deriveState(state: EnginBaseState): Record<string, unknown>;
}
