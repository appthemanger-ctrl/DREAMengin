/**
 * lib/engin-runtime/EnginCapabilities.ts
 *
 * Security / capabilities layer for Engins.
 *
 * Every action that an Engin can perform is declared as a capability string.
 * The engine consults the active capability map before executing any action.
 * Rule-sets declare which capabilities they require; the engine grants or
 * denies them at runtime.
 *
 * Server-side checks remain authoritative — this layer is defence-in-depth
 * on the client.  RLS on Supabase is the final enforcement boundary.
 *
 * Architecture: docs/AXIOMS.md §4 — security by default.
 */

// ─── Capability identifiers ───────────────────────────────────────────────────

export type EnginCapability =
  // Persistence
  | 'state:read'
  | 'state:write'
  | 'persistence:local'
  | 'persistence:remote'
  // Session
  | 'session:start'
  | 'session:end'
  | 'session:pause'
  | 'session:resume'
  // Scores / leaderboard
  | 'scores:read'
  | 'scores:publish'
  // World builder
  | 'world:edit'
  | 'world:save'
  // Assets / media
  | 'assets:load'
  | 'assets:upload'
  // Cross-engin
  | 'bridge:emit'
  | 'bridge:listen'
  // Admin / premium
  | 'scripts:edit'
  | 'scripts:run'
  | 'co-op:enable'
  // Custom capability for rule-set extension
  | `custom:${string}`;

// ─── Capability map ───────────────────────────────────────────────────────────

export type EnginCapabilityMap = Readonly<Record<EnginCapability, boolean>>;

/** All capabilities denied — safe starting point. */
export const DENY_ALL: EnginCapabilityMap = new Proxy({} as EnginCapabilityMap, {
  get: () => false,
});

/** Predefined set for a standard authenticated user. */
export const DEFAULT_USER_CAPABILITIES: EnginCapabilityMap = Object.freeze({
  'state:read': true,
  'state:write': true,
  'persistence:local': true,
  'persistence:remote': false,
  'session:start': true,
  'session:end': true,
  'session:pause': true,
  'session:resume': true,
  'scores:read': true,
  'scores:publish': true,
  'world:edit': true,
  'world:save': true,
  'assets:load': true,
  'assets:upload': false,
  'bridge:emit': true,
  'bridge:listen': true,
  'scripts:edit': false,
  'scripts:run': false,
  'co-op:enable': false,
} as Record<EnginCapability, boolean> as EnginCapabilityMap);

// ─── Runtime gate ─────────────────────────────────────────────────────────────

export interface CapabilityGateResult {
  granted: boolean;
  /** Populated when granted === false. */
  reason?: string;
}

/**
 * gateCapability(map, capability)
 *
 * Returns whether the given capability is granted in the active map.
 * This is the single enforcement point — engine calls this before any action.
 */
export function gateCapability(
  map: EnginCapabilityMap,
  capability: EnginCapability,
): CapabilityGateResult {
  const granted = (map as Record<string, boolean>)[capability] === true;
  return granted
    ? { granted: true }
    : { granted: false, reason: `Capability '${capability}' is not granted.` };
}

/**
 * mergeCapabilities(base, overrides)
 *
 * Returns a new capability map with override values applied on top of base.
 */
export function mergeCapabilities(
  base: EnginCapabilityMap,
  overrides: Partial<Record<EnginCapability, boolean>>,
): EnginCapabilityMap {
  return Object.freeze({ ...(base as Record<string, boolean>), ...overrides }) as EnginCapabilityMap;
}
