'use client';

/**
 * lib/runtime/moduleRegistry.ts
 *
 * In-memory registry for transferable Dream Window modules (ModuleManifests).
 *
 * Responsibilities:
 * - Register / unregister modules when surfaces mount/unmount.
 * - Transfer a module from one runtime to another, publishing to the bridge.
 * - Subscribe to bridge 'module:transfer' events so remote runtimes receive
 *   transferred modules automatically.
 * - Provide per-runtime module slices for SpatialSurface.
 *
 * Architecture justification: docs/ARCHITECTURE.md §4 (Universal Dream Window
 * model) and §12 (Runtime Memory Architecture — bridge as cross-runtime bus).
 * Performance impact: neutral — Zustand store; no polling loops.
 */

import { create } from 'zustand';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import type { ModuleManifest, RuntimeId } from '@/types/module-manifest';

// ── Store shape ────────────────────────────────────────────────────────────────

interface ModuleRegistryState {
  /** Flat record of all known modules, keyed by module ID. */
  modules: Record<string, ModuleManifest>;
  /** Register a module in the registry (upserts). */
  registerModule: (manifest: ModuleManifest) => void;
  /** Remove a module from the registry entirely. */
  unregisterModule: (id: string) => void;
  /**
   * Transfer a module to targetRuntime.
   * Updates sourceRuntime in-place and publishes to the bridge so other
   * surfaces can react. Returns false if the target is not in compatibleRuntimes.
   */
  transferModule: (id: string, targetRuntime: RuntimeId) => boolean;
  /** Return all modules whose sourceRuntime matches the given runtime. */
  getModulesForRuntime: (runtime: RuntimeId) => ModuleManifest[];
}

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useModuleRegistry = create<ModuleRegistryState>((set, get) => ({
  modules: {},

  registerModule(manifest) {
    set((state) => ({
      modules: { ...state.modules, [manifest.id]: manifest },
    }));
  },

  unregisterModule(id) {
    set((state) => {
      const next = { ...state.modules };
      delete next[id];
      return { modules: next };
    });
  },

  transferModule(id, targetRuntime) {
    const { modules } = get();
    const manifest = modules[id];
    if (!manifest) return false;
    if (!manifest.compatibleRuntimes.includes(targetRuntime)) return false;

    const updated: ModuleManifest = { ...manifest, sourceRuntime: targetRuntime };

    set((state) => ({
      modules: { ...state.modules, [id]: updated },
    }));

    // Publish to bridge so other runtimes can react.
    bridge.emit('module', 'transfer', {
      module: updated as unknown as Record<string, unknown>,
      targetRuntime,
      sourceRuntime: manifest.sourceRuntime,
    });

    return true;
  },

  getModulesForRuntime(runtime) {
    return Object.values(get().modules).filter((m) => m.sourceRuntime === runtime);
  },
}));

// ── Bridge subscription — receive transfers from remote runtimes ───────────────

/**
 * Call this once (e.g. from a root provider) to wire the registry into the
 * bridge so that modules transferred by other surfaces are applied locally.
 *
 * Returns the unsubscribe function.
 */
export function subscribeRegistryToTransferEvents(): () => void {
  return bridge.subscribe('module', 'transfer', (payload) => {
    const raw = payload as { module?: unknown; targetRuntime?: unknown };
    if (!raw.module || typeof raw.module !== 'object') return;
    const manifest = raw.module as ModuleManifest;
    if (!manifest.id) return;
    useModuleRegistry.getState().registerModule(manifest);
  });
}

// ── Helper: build a ModuleManifest from a WidgetInstance ─────────────────────

import type { WidgetInstance } from '@/types/widgets';
import { getWidgetType } from '@/types/widgets';

/**
 * Derive a ModuleManifest from a WidgetInstance so existing Dream Windows can
 * participate in the Universal Editor without schema migration.
 */
export function manifestFromWidget(
  widget: WidgetInstance,
  sourceRuntime: RuntimeId = 'homedream',
): ModuleManifest {
  const type = getWidgetType(widget) ?? 'custom';
  // All types are transferable to dreamspace by default; extend as needed.
  const compatibleRuntimes: RuntimeId[] = ['homedream', 'dreamspace'];

  return {
    id: widget.id,
    type: type as ModuleManifest['type'],
    sourceRuntime,
    compatibleRuntimes,
    content: widget.config ?? widget.config_json ?? {},
    ui: {
      defaultSize: { width: 320, height: 200 },
      resizable: true,
      movable: widget.is_enabled !== false,
    },
  };
}
