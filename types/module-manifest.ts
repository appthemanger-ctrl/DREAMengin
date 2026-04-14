/**
 * types/module-manifest.ts
 *
 * ModuleManifest — the canonical shape for a transferable Dream Window module.
 *
 * Every Dream Window that participates in the Universal Editor (drag, transfer,
 * spatial layout) must carry a ModuleManifest so the DraggableModule wrapper
 * knows how to handle it.
 *
 * Architecture: docs/ARCHITECTURE.md §4 — Universal Dream Window model.
 * Naming: uses canonical "runtime" vocabulary per docs/LAW.md route law.
 */

/** All runtimes a module may declare as source or target. */
export type RuntimeId =
  | 'homedream'
  | 'dreamspace'
  | 'daydream:music'
  | 'daydream:games'
  | 'daydream:lab'
  | 'daydream:code'
  | 'daydream:brand'
  | 'daydream:create'
  | 'engin:starmaker'
  | 'engin:game'
  | 'engin:lab'
  | 'engin:code'
  | 'engin:brand'
  | 'engin:content'
  | (string & {});

/** Module types matching Dream Window categories. */
export type ModuleType =
  | 'feed'
  | 'music-player'
  | 'game-launcher'
  | 'code-snippet'
  | 'notes'
  | 'custom'
  | (string & {});

/**
 * The manifest that every transferable Dream Window carries.
 *
 * The `content` field must be JSON-serialisable — it is the state snapshot
 * sent via the bridge when a module is transferred to another runtime.
 */
export interface ModuleManifest {
  /** Stable unique ID — matches the widget/Dream Window ID in the database. */
  id: string;
  /** Semantic category for this module. */
  type: ModuleType;
  /** Which runtime this module currently lives in. */
  sourceRuntime: RuntimeId;
  /**
   * Runtimes this module is allowed to be transferred to.
   * An empty array means the module is not transferable.
   */
  compatibleRuntimes: RuntimeId[];
  /** JSON-serialisable state snapshot — persisted across transfers. */
  content: unknown;
  /** UI constraints used by DraggableModule and SpatialSurface. */
  ui: {
    defaultSize: { width: number; height: number };
    resizable: boolean;
    movable: boolean;
  };
}
