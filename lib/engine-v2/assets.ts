// lib/engine-v2/assets.ts
// Phase 7 — Asset pipeline: content manifest, asset loader with caching,
// lazy loading, prefab system, content versioning, sprite sheet metadata.
// Pure module — no React, no DOM dependencies.

// ---------------------------------------------------------------------------
// Content manifest format
// ---------------------------------------------------------------------------

export type AssetType = 'mesh' | 'texture' | 'audio' | 'prefab' | 'spriteSheet';

export interface AssetEntry {
  id: string;
  type: AssetType;
  /** Relative URL to the asset file. */
  url: string;
  /** If true, block scene start until loaded. */
  essential: boolean;
  /** Compression format hint. */
  compression?: 'webp' | 'basis' | 'none';
}

export interface ContentManifest {
  /** Version tag for cache invalidation. */
  version: string;
  /** Human-readable scene name. */
  scene: string;
  assets: AssetEntry[];
}

export function validateManifest(manifest: ContentManifest): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (!manifest.version) errors.push('Missing manifest version');
  if (!manifest.scene) errors.push('Missing scene name');

  for (const asset of manifest.assets) {
    if (!asset.id) errors.push(`Asset missing id`);
    if (!asset.url) errors.push(`Asset "${asset.id}" missing url`);
    if (!asset.type) errors.push(`Asset "${asset.id}" missing type`);
    if (ids.has(asset.id)) errors.push(`Duplicate asset id: "${asset.id}"`);
    ids.add(asset.id);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Sprite sheet metadata
// ---------------------------------------------------------------------------

export interface SpriteSheetMeta {
  id: string;
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  /** Map of animation name → ordered frame indices. */
  animations: Record<string, number[]>;
}

// ---------------------------------------------------------------------------
// Asset loader (reference-counted cache)
// ---------------------------------------------------------------------------

export type AssetLoadStatus = 'pending' | 'loading' | 'loaded' | 'error';

export interface CachedAsset<T = unknown> {
  entry: AssetEntry;
  status: AssetLoadStatus;
  data: T | null;
  error: string | null;
  refCount: number;
}

export class AssetCache {
  private readonly cache = new Map<string, CachedAsset>();

  /** Register an asset entry (no fetch yet). */
  register(entry: AssetEntry): void {
    if (!this.cache.has(entry.id)) {
      this.cache.set(entry.id, {
        entry,
        status: 'pending',
        data: null,
        error: null,
        refCount: 0,
      });
    }
  }

  retain(id: string): void {
    const asset = this.cache.get(id);
    if (asset) asset.refCount++;
  }

  release(id: string): void {
    const asset = this.cache.get(id);
    if (asset) {
      asset.refCount = Math.max(0, asset.refCount - 1);
      // Evict when no references remain (optional; uncomment if needed).
      // if (asset.refCount === 0) this.cache.delete(id);
    }
  }

  markLoading(id: string): void {
    const asset = this.cache.get(id);
    if (asset) asset.status = 'loading';
  }

  markLoaded(id: string, data: unknown): void {
    const asset = this.cache.get(id);
    if (asset) {
      asset.status = 'loaded';
      asset.data = data;
      asset.error = null;
    }
  }

  markError(id: string, error: string): void {
    const asset = this.cache.get(id);
    if (asset) {
      asset.status = 'error';
      asset.error = error;
    }
  }

  get(id: string): CachedAsset | undefined {
    return this.cache.get(id);
  }

  isLoaded(id: string): boolean {
    return this.cache.get(id)?.status === 'loaded';
  }

  /** Return IDs of all essential assets that are not yet loaded. */
  pendingEssentials(): string[] {
    const pending: string[] = [];
    for (const [id, asset] of this.cache) {
      if (asset.entry.essential && asset.status !== 'loaded') {
        pending.push(id);
      }
    }
    return pending;
  }

  allLoaded(): boolean {
    for (const asset of this.cache.values()) {
      if (asset.status !== 'loaded' && asset.status !== 'error') return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ---------------------------------------------------------------------------
// Prefab system
// ---------------------------------------------------------------------------

export type ComponentData = Record<string, unknown>;

export interface PrefabDef {
  id: string;
  /** Display name (for dev tooling). */
  name: string;
  /** Component definitions: map of componentType → initial data. */
  components: Record<string, ComponentData>;
  /** Asset IDs that this prefab requires. */
  requiredAssets: string[];
  /** If set, this prefab is rendered using a named mesh asset. */
  meshId?: string;
}

export interface PrefabRegistry {
  prefabs: Map<string, PrefabDef>;
}

export function createPrefabRegistry(): PrefabRegistry {
  return { prefabs: new Map() };
}

export function registerPrefab(registry: PrefabRegistry, def: PrefabDef): void {
  registry.prefabs.set(def.id, def);
}

export function instantiatePrefab(
  registry: PrefabRegistry,
  prefabId: string,
  overrides: Partial<Record<string, ComponentData>> = {},
): Record<string, ComponentData> | null {
  const def = registry.prefabs.get(prefabId);
  if (!def) return null;

  const components: Record<string, ComponentData> = {};
  for (const [type, data] of Object.entries(def.components)) {
    components[type] = { ...data, ...(overrides[type] ?? {}) };
  }
  return components;
}

// ---------------------------------------------------------------------------
// Starter pack manifest (sample — new scenes can copy this)
// ---------------------------------------------------------------------------

export const STARTER_PACK_MANIFEST: ContentManifest = {
  version: '1.0.0',
  scene: 'starter',
  assets: [
    {
      id: 'placeholder-mesh',
      type: 'mesh',
      url: '/assets/meshes/placeholder.glb',
      essential: false,
      compression: 'none',
    },
    {
      id: 'placeholder-texture',
      type: 'texture',
      url: '/assets/textures/placeholder.webp',
      essential: false,
      compression: 'webp',
    },
    {
      id: 'default-sprite-sheet',
      type: 'spriteSheet',
      url: '/assets/sprites/default.webp',
      essential: true,
      compression: 'webp',
    },
  ],
};
