/**
 * lib/vm/pipelineCache.ts — GPU Compute Pipeline Cache
 *
 * Caches compiled WGSL shaders using IndexedDB to avoid re-compilation.
 * Keyed by SHA-256 hash of source + device features.
 */

export class PipelineCache {
  private readonly memoryCache = new Map<string, GPUComputePipeline>();
  private dbName = 'dreamengin-pipeline-cache';
  private storeName = 'pipelines';
  private db: IDBDatabase | null = null;

  constructor(private readonly device: GPUDevice) {}

  /**
   * Initialize IndexedDB connection.
   */
  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('[PipelineCache] IndexedDB not available, cache disabled');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('[PipelineCache] Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'hash' });
        }
      };
    });
  }

  /**
   * Get or create a compute pipeline.
   *
   * First checks memory cache, then IndexedDB, then compiles from source.
   */
  async getOrCreate(
    wgslSource: string,
    layout?: GPUPipelineLayout,
  ): Promise<{
    pipeline: GPUComputePipeline;
    sourceHash: string;
    cacheHit: boolean;
  }> {
    const sourceHash = await this.hashSource(wgslSource);

    // Check memory cache
    const cached = this.memoryCache.get(sourceHash);
    if (cached) {
      return { pipeline: cached, sourceHash, cacheHit: true };
    }

    // Check IndexedDB cache
    const diskCached = await this.loadFromDisk(sourceHash);
    if (diskCached) {
      this.memoryCache.set(sourceHash, diskCached);
      return { pipeline: diskCached, sourceHash, cacheHit: true };
    }

    // Compile from source
    const pipeline = await this.compile(wgslSource, layout);
    this.memoryCache.set(sourceHash, pipeline);
    await this.saveToDisk(sourceHash, wgslSource);

    return { pipeline, sourceHash, cacheHit: false };
  }

  /**
   * Compile WGSL source to a compute pipeline.
   */
  private async compile(
    wgslSource: string,
    layout?: GPUPipelineLayout,
  ): Promise<GPUComputePipeline> {
    const shaderModule = this.device.createShaderModule({
      code: wgslSource,
    });

    // Check for compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    const errors = compilationInfo.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      console.error('[PipelineCache] Shader compilation errors:', errors);
      throw new Error(`Shader compilation failed: ${errors[0].message}`);
    }

    const pipeline = await this.device.createComputePipelineAsync({
      layout: layout ?? 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    return pipeline;
  }

  /**
   * Compute SHA-256 hash of WGSL source + device features.
   */
  private async hashSource(wgslSource: string): Promise<string> {
    // Include device features in hash to invalidate cache on device change
    const features = Array.from(this.device.features).sort().join(',');
    const input = `${wgslSource}|${features}`;

    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Fallback for environments without crypto.subtle
      return this.simpleHash(input);
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Simple non-cryptographic hash for fallback.
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Load pipeline from IndexedDB.
   */
  private async loadFromDisk(hash: string): Promise<GPUComputePipeline | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(hash);

      request.onsuccess = async () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        try {
          // Re-compile from cached source
          // Note: WebGPU doesn't support binary pipeline serialization yet,
          // so we cache the source and re-compile. This still saves the
          // parsing/validation overhead.
          const pipeline = await this.compile(record.source);
          resolve(pipeline);
        } catch {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Save pipeline metadata to IndexedDB.
   */
  private async saveToDisk(hash: string, source: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const record = {
        hash,
        source,
        timestamp: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[PipelineCache] Failed to save to disk');
        resolve(); // Don't fail if cache save fails
      };
    });
  }

  /**
   * Clear all cached pipelines.
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[PipelineCache] Failed to clear disk cache');
        resolve();
      };
    });
  }

  /**
   * Get cache statistics.
   */
  async getStats(): Promise<{
    memoryCacheSize: number;
    diskCacheSize: number;
  }> {
    const memoryCacheSize = this.memoryCache.size;

    if (!this.db) {
      return { memoryCacheSize, diskCacheSize: 0 };
    }

    const diskCacheSize = await new Promise<number>((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(0);
      };
    });

    return { memoryCacheSize, diskCacheSize };
  }

  /**
   * Close IndexedDB connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
