/**
 * lib/assets/assetOptimizer.ts
 *
 * Client-side asset optimisation coordinator (spec §5).
 *
 * Orchestrates a Web Worker (`/workers/asset-optimizer.worker.js`) that
 * performs the actual heavy lifting (Canvas/WASM/WebCodecs), while this
 * module handles:
 *   - Spawning / reusing the singleton worker.
 *   - Dispatching jobs with progress callbacks.
 *   - Storing the original file in IndexedDB via indexedDBStore.
 *   - Returning the optimised Blob ready for upload.
 *
 * Quality presets (per spec):
 *   high        — best quality, largest file
 *   balanced    — default, good quality / size tradeoff
 *   performance — smallest file, acceptable quality for slow connections
 *
 * Usage:
 *   const result = await optimiseAsset(file, {
 *     quality: 'balanced',
 *     context: 'dreamr_feed',
 *     onProgress: (pct) => setProgress(pct),
 *   });
 *   // result.optimised  — Blob ready for upload
 *   // result.assetId    — UUID to retrieve original from IndexedDB
 */

import { storeOriginal } from './indexedDBStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export type OptimisationQuality = 'high' | 'balanced' | 'performance';

export type AssetUploadContext =
  | 'dreamr_feed'
  | 'profile'
  | 'starmaker'
  | 'general';

export interface OptimiseOptions {
  /** Target quality preset. Default: 'balanced'. */
  quality?: OptimisationQuality;
  /** Context used for folder routing in the registry. */
  context?: AssetUploadContext;
  /** Progress callback — receives 0-100. */
  onProgress?: (percent: number) => void;
}

export interface OptimisationResult {
  /** The optimised Blob to upload to the server. */
  optimised: Blob;
  /** Extension / MIME of the optimised file (e.g. 'image/avif'). */
  mimeType: string;
  /** File extension (e.g. '.avif'). */
  extension: string;
  /** Original file size in bytes. */
  originalSize: number;
  /** Optimised file size in bytes. */
  optimisedSize: number;
  /** UUID used to retrieve the original from IndexedDB. */
  assetId: string;
  /** Human-readable method (e.g. 'canvas-avif', 'webcodecs-h264'). */
  method: string;
}

// ── Worker singleton ───────────────────────────────────────────────────────────

let workerInstance: Worker | null = null;
let jobCounter = 0;
const pendingJobs = new Map<
  number,
  {
    resolve: (r: OptimisationResult) => void;
    reject: (e: Error) => void;
    onProgress?: (pct: number) => void;
  }
>();

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker('/workers/asset-optimizer.worker.js');
    workerInstance.onmessage = (e: MessageEvent) => {
      const { jobId, type, payload } = e.data as {
        jobId: number;
        type: 'progress' | 'done' | 'error';
        payload: unknown;
      };
      const job = pendingJobs.get(jobId);
      if (!job) return;

      if (type === 'progress') {
        job.onProgress?.(payload as number);
      } else if (type === 'done') {
        pendingJobs.delete(jobId);
        job.resolve(payload as OptimisationResult);
      } else if (type === 'error') {
        pendingJobs.delete(jobId);
        job.reject(new Error((payload as { message: string }).message));
      }
    };
  }
  return workerInstance;
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Optimises a file using a Web Worker and stores the original in IndexedDB.
 *
 * The returned result contains the optimised Blob for uploading and the
 * assetId for later retrieval of the original (if still available locally).
 */
export async function optimiseAsset(
  file: File,
  options: OptimiseOptions = {},
): Promise<OptimisationResult> {
  const { quality = 'balanced', context = 'general', onProgress } = options;

  // Generate a unique ID for this asset.
  const assetId = crypto.randomUUID();

  // Store original in IndexedDB before optimisation starts.
  await storeOriginal(assetId, file, file.name);

  onProgress?.(5);

  // Dispatch to worker.
  const worker = getWorker();
  const jobId = ++jobCounter;

  return new Promise<OptimisationResult>((resolve, reject) => {
    pendingJobs.set(jobId, { resolve, reject, onProgress });

    worker.postMessage({
      jobId,
      assetId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      quality,
      context,
    }, []);

    // The worker needs the file content — transfer via a separate message
    // after the job is registered to keep the message ordering clear.
    file.arrayBuffer().then((buf) => {
      worker.postMessage({ jobId, type: 'file_data', buffer: buf }, [buf]);
    }).catch(reject);
  });
}

/**
 * Returns the appropriate folder and source tags for the global_registry
 * based on the upload context.
 */
export function registryTagsForContext(context: AssetUploadContext): {
  folder: string;
  source: string;
} {
  switch (context) {
    case 'dreamr_feed':
      return { folder: 'dreamr_feed', source: 'dreamr_feed' };
    case 'profile':
      return { folder: 'dreamr_profile', source: 'profile' };
    case 'starmaker':
      return { folder: 'starmaker_audio', source: 'starmaker' };
    default:
      return { folder: 'general', source: 'general' };
  }
}
