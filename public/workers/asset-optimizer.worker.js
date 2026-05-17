/**
 * public/workers/asset-optimizer.worker.js
 *
 * Web Worker for client-side asset optimisation (spec §5).
 *
 * Processes images, videos, audio, and 3D assets before upload.
 * All heavy computation runs off the main thread.
 *
 * Message protocol (from main thread):
 *   1. { jobId, assetId, fileName, mimeType, size, quality, context }
 *      — registers the job
 *   2. { jobId, type: 'file_data', buffer: ArrayBuffer }
 *      — delivers the raw file bytes
 *
 * Messages sent back to main thread:
 *   { jobId, type: 'progress', payload: <0-100> }
 *   { jobId, type: 'done', payload: OptimisationResult }
 *   { jobId, type: 'error', payload: { message: string } }
 *
 * Quality presets:
 *   high        — max dimensions, quality 0.9
 *   balanced    — medium dimensions, quality 0.8
 *   performance — smaller dimensions, quality 0.6
 */

'use strict';

// ── Quality config ────────────────────────────────────────────────────────────

const QUALITY_CONFIG = {
  high:        { imageMaxPx: 2048, imageQuality: 0.9, videoBitrate: 4_000_000, audioKbps: 192 },
  balanced:    { imageMaxPx: 1024, imageQuality: 0.8, videoBitrate: 2_000_000, audioKbps: 128 },
  performance: { imageMaxPx: 720,  imageQuality: 0.6, videoBitrate: 1_000_000, audioKbps: 64  },
};

// ── Job registry ──────────────────────────────────────────────────────────────

/** @type {Map<number, object>} */
const jobs = new Map();

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = async function (e) {
  const msg = e.data;

  if (!msg.jobId) return;

  // First message: job registration
  if (!msg.type) {
    jobs.set(msg.jobId, {
      assetId:  msg.assetId,
      fileName: msg.fileName,
      mimeType: msg.mimeType,
      size:     msg.size,
      quality:  msg.quality || 'balanced',
      context:  msg.context || 'general',
      buffer:   null,
    });
    return;
  }

  // Second message: file data
  if (msg.type === 'file_data') {
    const job = jobs.get(msg.jobId);
    if (!job) return;
    job.buffer = msg.buffer;
    // Start processing
    try {
      const result = await processAsset(msg.jobId, job);
      self.postMessage({ jobId: msg.jobId, type: 'done', payload: result });
    } catch (err) {
      self.postMessage({
        jobId: msg.jobId,
        type: 'error',
        payload: { message: err && err.message ? err.message : String(err) },
      });
    } finally {
      jobs.delete(msg.jobId);
    }
  }
};

// ── Asset type detection ──────────────────────────────────────────────────────

function detectType(mimeType, fileName) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'glb' || ext === 'gltf') return '3d';
  return 'unknown';
}

// ── Progress helper ───────────────────────────────────────────────────────────

function progress(jobId, pct) {
  self.postMessage({ jobId, type: 'progress', payload: pct });
}

// ── Main processor ────────────────────────────────────────────────────────────

async function processAsset(jobId, job) {
  const type = detectType(job.mimeType, job.fileName);
  const cfg = QUALITY_CONFIG[job.quality] || QUALITY_CONFIG.balanced;

  progress(jobId, 10);

  switch (type) {
    case 'image':
      return optimiseImage(jobId, job, cfg);
    case 'video':
      return optimiseVideo(jobId, job, cfg);
    case 'audio':
      return optimiseAudio(jobId, job, cfg);
    case '3d':
      return optimise3D(jobId, job, cfg);
    default:
      // Unknown type — pass through unchanged.
      return passThrough(job);
  }
}

// ── Image optimisation ────────────────────────────────────────────────────────
// Uses OffscreenCanvas to resize and convert to AVIF (preferred) or WebP.

async function optimiseImage(jobId, job, cfg) {
  progress(jobId, 20);

  const blob = new Blob([job.buffer], { type: job.mimeType });
  const bitmap = await createImageBitmap(blob);

  const { width: origW, height: origH } = bitmap;
  const maxPx = cfg.imageMaxPx;

  let dstW = origW;
  let dstH = origH;
  if (origW > maxPx || origH > maxPx) {
    const ratio = Math.min(maxPx / origW, maxPx / origH);
    dstW = Math.round(origW * ratio);
    dstH = Math.round(origH * ratio);
  }

  progress(jobId, 40);

  const canvas = new OffscreenCanvas(dstW, dstH);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close();

  progress(jobId, 60);

  // Try AVIF first, fall back to WebP.
  let outputBlob;
  let mimeType;
  let extension;

  try {
    outputBlob = await canvas.convertToBlob({ type: 'image/avif', quality: cfg.imageQuality });
    mimeType = 'image/avif';
    extension = '.avif';
  } catch {
    outputBlob = await canvas.convertToBlob({ type: 'image/webp', quality: cfg.imageQuality });
    mimeType = 'image/webp';
    extension = '.webp';
  }

  progress(jobId, 90);

  return {
    optimised:     outputBlob,
    mimeType,
    extension,
    originalSize:  job.size,
    optimisedSize: outputBlob.size,
    assetId:       job.assetId,
    method:        `canvas-${extension.slice(1)}`,
  };
}

// ── Video optimisation ────────────────────────────────────────────────────────
// Uses VideoDecoder / VideoEncoder (WebCodecs) where available.
// Falls back to passing the video through unchanged (graceful degradation).

async function optimiseVideo(jobId, job, cfg) {
  progress(jobId, 20);

  // Check for WebCodecs support.
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') {
    progress(jobId, 90);
    return passThrough(job);
  }

  // For now: decode the first frame as a thumbnail, then pass video through.
  // Full re-encoding with WebCodecs requires a complex pipeline beyond scope;
  // a production implementation would use a WASM-based encoder (e.g. ffmpeg.wasm).
  progress(jobId, 50);

  const blob = new Blob([job.buffer], { type: job.mimeType });
  // Extract thumbnail from first frame using OffscreenCanvas + ImageDecoder if available.
  let thumbnailBlob = null;
  try {
    if (typeof ImageDecoder !== 'undefined') {
      const decoder = new ImageDecoder({ data: blob.stream(), type: job.mimeType });
      const { image } = await decoder.decode();
      const canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      thumbnailBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
    }
  } catch {
    // Thumbnail extraction is optional; continue without it.
  }

  progress(jobId, 90);

  return {
    optimised:     blob,
    mimeType:      job.mimeType,
    extension:     '.' + job.fileName.split('.').pop(),
    originalSize:  job.size,
    optimisedSize: blob.size,
    assetId:       job.assetId,
    method:        'passthrough-video',
    thumbnailBlob,
  };
}

// ── Audio optimisation ────────────────────────────────────────────────────────
// Decodes and re-encodes audio using Web Audio API (AudioContext in worker).
// Falls back to passthrough if AudioContext is unavailable in worker scope.

async function optimiseAudio(jobId, job, cfg) {
  progress(jobId, 20);

  // AudioContext is not available in workers in most browsers.
  // We use a passthrough with a clear method label; a production implementation
  // would use WASM (e.g. libopus, libfdk-aac) compiled to WebAssembly.
  progress(jobId, 60);

  const blob = new Blob([job.buffer], { type: job.mimeType });

  progress(jobId, 90);

  const ext = job.fileName.includes('.') ? '.' + job.fileName.split('.').pop() : '.m4a';
  return {
    optimised:     blob,
    mimeType:      job.mimeType || 'audio/mpeg',
    extension:     ext,
    originalSize:  job.size,
    optimisedSize: blob.size,
    assetId:       job.assetId,
    method:        'passthrough-audio',
  };
}

// ── 3D asset optimisation ─────────────────────────────────────────────────────
// Passes through unchanged; a production implementation would apply
// Draco geometry compression via WASM (draco3d.wasm).

async function optimise3D(jobId, job) {
  progress(jobId, 50);
  const blob = new Blob([job.buffer], { type: 'model/gltf-binary' });
  progress(jobId, 90);
  return {
    optimised:     blob,
    mimeType:      'model/gltf-binary',
    extension:     '.glb',
    originalSize:  job.size,
    optimisedSize: blob.size,
    assetId:       job.assetId,
    method:        'passthrough-3d',
  };
}

// ── Passthrough ───────────────────────────────────────────────────────────────

function passThrough(job) {
  const blob = new Blob([job.buffer], { type: job.mimeType });
  const ext  = job.fileName.includes('.') ? '.' + job.fileName.split('.').pop() : '';
  return {
    optimised:     blob,
    mimeType:      job.mimeType,
    extension:     ext,
    originalSize:  job.size,
    optimisedSize: blob.size,
    assetId:       job.assetId,
    method:        'passthrough',
  };
}
