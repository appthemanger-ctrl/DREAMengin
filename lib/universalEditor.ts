/**
 * Universal Editor — Module Manifest + Transfer Protocol
 *
 * Defines the cross-runtime module manifest type and the local event
 * bus factory used by engine assemblies.
 */

import { createEventBus, type EventBus } from './eventBus';

// ─── Runtime IDs ─────────────────────────────────────────────────────────────

export type RuntimeId = 'HomeDream' | 'DreamSpace' | 'Daydream' | 'Engin';

// ─── Module Manifest ─────────────────────────────────────────────────────────

export interface ModuleManifest {
  /** Unique module identifier. */
  id: string;
  /** Human-readable module type label. */
  type: string;
  /** The runtime this module was originally created in. */
  sourceRuntime: RuntimeId;
  /** Runtimes that can accept this module. */
  compatibleRuntimes: RuntimeId[];
  /** Serialisable module content (component state, config, etc.). */
  content: Record<string, unknown>;
  /** Optional rendering / layout hints for the target runtime. */
  uiHints?: {
    minWidth?: number;
    minHeight?: number;
    prefersDark?: boolean;
    [key: string]: unknown;
  };
}

// ─── Assembly-Scoped Event Bus ────────────────────────────────────────────────

export type AssemblyEvents = Record<string, unknown>;

/**
 * createLocalEventBus()
 *
 * Returns a new scoped event bus for a single engine assembly.
 * Must NOT be shared across assemblies.
 */
export function createLocalEventBus(): EventBus<AssemblyEvents> {
  return createEventBus<AssemblyEvents>();
}

// ─── Transfer Validation ──────────────────────────────────────────────────────

/**
 * canTransfer(manifest, targetRuntime)
 *
 * Returns whether a module manifest is compatible with a target runtime.
 */
export function canTransfer(manifest: ModuleManifest, targetRuntime: RuntimeId): boolean {
  return manifest.compatibleRuntimes.includes(targetRuntime);
}

/**
 * transferModule(manifest, targetRuntime)
 *
 * Validates and returns a new manifest stamped with the new source
 * runtime, or throws if incompatible.
 */
export function transferModule(
  manifest: ModuleManifest,
  targetRuntime: RuntimeId
): ModuleManifest {
  if (!canTransfer(manifest, targetRuntime)) {
    throw new Error(
      `Module "${manifest.id}" (type: ${manifest.type}) is not compatible with runtime "${targetRuntime}".`
    );
  }
  return { ...manifest, sourceRuntime: targetRuntime };
}
