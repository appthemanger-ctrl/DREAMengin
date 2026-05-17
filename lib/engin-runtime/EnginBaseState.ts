/**
 * lib/engin-runtime/EnginBaseState.ts
 *
 * Base state model shared by every Engin.
 *
 * The engine holds a BaseState and a RuleSet.  The RuleSet's transform
 * function maps (BaseState, EnginAction) → BaseState; the engine then
 * derives the UI-facing DerivedState by running any registered selectors.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Kernel owns state.
 */

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export type EnginLifecycle = 'idle' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped';

// ─── Base state record ────────────────────────────────────────────────────────

/**
 * EnginBaseState — the immutable core state owned by every engine instance.
 *
 * The engine never exposes this directly; the active rule-set transforms it
 * into a domain-specific DerivedState.
 */
export interface EnginBaseState {
  /** Canonical engine identifier (e.g. 'games', 'music', 'code'). */
  readonly enginId: string;
  /** Current lifecycle stage. */
  readonly lifecycle: EnginLifecycle;
  /** ISO-8601 timestamp of the last state mutation. */
  readonly updatedAt: string;
  /** Monotonically increasing action counter (for optimistic-UI purposes). */
  readonly revision: number;
  /** Arbitrary key-value bag owned by the active rule-set. */
  readonly domain: Readonly<Record<string, unknown>>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create the initial base state for an engine. */
export function createBaseState(enginId: string: EnginBaseState) {
  return {
    enginId,
    lifecycle: 'idle',
    updatedAt: new Date().toISOString(),
    revision: 0,
    domain: {},
  };
}

/**
 * Produce a new EnginBaseState by merging a partial domain update.
 * The engine calls this internally — rule-sets must not mutate state directly.
 */
export function patchBaseState(
  prev: EnginBaseState,
  patch: Partial<Omit<EnginBaseState, 'enginId' | 'revision' | 'updatedAt'>>,
): EnginBaseState {
  return {
    ...prev,
    ...patch,
    domain: { ...prev.domain, ...(patch.domain ?? {}) },
    revision: prev.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}
