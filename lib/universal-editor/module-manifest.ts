/**
 * lib/universal-editor/module-manifest.ts — §39 Module Manifest
 *
 * Typed manifest for cross-runtime module transfer.
 * Compatible with the existing universalEditor.ts in lib/.
 */

// ─── Runtime IDs ──────────────────────────────────────────────────────────────

export type RuntimeId = 'HomeDream' | 'DreamSpace' | 'Daydream' | 'Engin';

// ─── UI Hints ─────────────────────────────────────────────────────────────────

export interface UIHints {
  minWidth?:     number;
  minHeight?:    number;
  prefersDark?:  boolean;
  aspectRatio?:  string;
  [key: string]: unknown;
}

// ─── Module Manifest ──────────────────────────────────────────────────────────

export interface ModuleManifest {
  /** Unique module identifier. */
  id: string;
  /** Human-readable module type label (e.g. 'waveform', 'beat-grid'). */
  type: string;
  /** The runtime this module currently lives in. */
  sourceRuntime: RuntimeId;
  /** Runtimes that can receive this module. */
  compatibleRuntimes: RuntimeId[];
  /** Serialisable module content / state. */
  content: Record<string, unknown>;
  /** Optional rendering / layout hints for the destination runtime. */
  uiHints?: UIHints;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createManifest(overrides)
 *
 * Factory for ModuleManifest with sensible defaults.
 * The caller must supply at minimum `id` and `type`.
 */
export function createManifest(
  overrides: Partial<ModuleManifest> & Pick<ModuleManifest, 'id' | 'type'>,
): ModuleManifest {
  return {
    sourceRuntime:      'HomeDream',
    compatibleRuntimes: ['HomeDream', 'DreamSpace', 'Daydream', 'Engin'],
    content:            {},
    ...overrides,
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Returns true when the manifest is valid (has id, type, at least one compat runtime). */
export function isValidManifest(m: unknown): m is ModuleManifest {
  if (!m || typeof m !== 'object') return false;
  const obj = m as Record<string, unknown>;
  return (
    typeof obj['id'] === 'string' && obj['id'].length > 0 &&
    typeof obj['type'] === 'string' && obj['type'].length > 0 &&
    Array.isArray(obj['compatibleRuntimes']) &&
    (obj['compatibleRuntimes'] as unknown[]).length > 0
  );
}

/** Check whether a manifest can be transferred to targetRuntime. */
export function canTransferTo(manifest: ModuleManifest, target: RuntimeId): boolean {
  return manifest.compatibleRuntimes.includes(target);
}
