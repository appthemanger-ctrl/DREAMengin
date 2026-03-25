// lib/child-safety/scanMediaUrls.ts
// TheBoogieMan.Ai — Real-Time Media URL Scanner
//
// Shared helper used by the posts, messages, and upload route handlers to scan
// image attachments at write time — before the content is written to the DB.
//
// Pipeline per URL:
//   1. Fetch the image (10-second timeout, max 5 MB)
//   2. Compute SHA-256 of raw bytes → compare against known-bad hash registry
//   3. Convert to base64 → run LLM image classifier (classifyImage)
//   4. Call scanContent with the image classification result
//
// Returns the most severe ChildSafetyResult found across all URLs.
// If all pass, returns a CLEAN result.
// Never throws — errors are logged and skipped (fail open for transient issues).
//
// Usage:
//   import { scanMediaUrlsForChildSafety } from '@/lib/child-safety/scanMediaUrls';
//   const result = await scanMediaUrlsForChildSafety({
//     urls: ['https://...', 'https://...'],
//     supabase,
//   });
//   if (result.flagged) { /* block the content */ }

import { createHash } from 'crypto';
import { scanContent } from './childSafetyDetector';
import { classifyImage } from './imageClassifier';
import type { ChildSafetyResult } from './childSafetyDetector';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of images to scan per request (prevents DoS via large posts) */
const MAX_IMAGES_PER_SCAN = 4;

/** Fetch timeout per image (ms) */
const FETCH_TIMEOUT_MS = 10_000; // 10-second timeout per image

/** Maximum image size to scan (5 MB decoded) */
const MAX_IMAGE_BYTES = 5_242_880;

/** Image MIME type prefix — only scan images, not video/audio/documents */
const IMAGE_MIME_PREFIX = 'image/';

/** Allowed image MIME types for LLM classification */
type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
const SUPPORTED_IMAGE_MIMES: ImageMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** File extension → MIME type fallback (for when Content-Type header is absent) */
const EXT_TO_MIME: Record<string, ImageMime> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  gif:  'image/gif',
};

// ============================================================================
// TYPES
// ============================================================================

// Minimal Supabase client shape needed for hash registry lookup
interface SupabaseLike {
  from: (table: string) => {
    select: (cols: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any[] | null;
      error?: unknown | null;
    };
  };
}

export interface ScanMediaUrlsInput {
  /** Public image URLs to scan (Supabase Storage or CDN) */
  urls: string[];
  /** Supabase server client (for known-bad hash registry lookup) */
  supabase: SupabaseLike;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Infer MIME type from Content-Type header or URL path extension */
function inferMime(contentType: string | null, url: string): ImageMime | null {
  if (contentType) {
    const base = contentType.split(';')[0].trim().toLowerCase();
    if (SUPPORTED_IMAGE_MIMES.includes(base as ImageMime)) {
      return base as ImageMime;
    }
    if (base.startsWith(IMAGE_MIME_PREFIX)) {
      // Unsupported image type — still mark as jpeg for classification attempt
      return 'image/jpeg';
    }
    // Non-image content type (video, audio, etc.) — skip
    return null;
  }

  // Fallback: infer from file extension in URL path
  const pathname = new URL(url).pathname;
  const ext = pathname.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? null;
}

/** Load known-bad hashes from child_safety_hash_registry. Returns empty Set on error. */
async function loadKnownBadHashes(supabase: SupabaseLike): Promise<Set<string>> {
  try {
    const { data, error } = await (supabase as any)
      .from('child_safety_hash_registry')
      .select('hash_sha256');
    if (error || !data) return new Set();
    return new Set(
      (data as { hash_sha256: string }[]).map((r) => r.hash_sha256.toLowerCase()),
    );
  } catch {
    return new Set();
  }
}

/**
 * A CLEAN sentinel result — returned when no images were flagged.
 */
function cleanResult(): ChildSafetyResult {
  return {
    flagged: false,
    rule_code: null,
    severity: 0,
    confidence: 0,
    category: 'CLEAN',
    signal_count: 0,
    _audit: { signals: [], hash_match: false },
  };
}

/**
 * Fetch a single image URL with a timeout (10 seconds).
 * Returns null if the fetch fails, times out, or the response is too large.
 */
async function fetchImageWithTimeout(
  url: string,
): Promise<{ buffer: Buffer; mime: ImageMime | null } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type');
    const mime = inferMime(contentType, url);
    if (mime === null) return null; // not a scannable image type

    // Guard against very large files
    const contentLength = parseInt(res.headers.get('content-length') ?? '0', 10);
    if (contentLength > MAX_IMAGE_BYTES) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;

    return { buffer, mime };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * scanMediaUrlsForChildSafety — scan one or more image URLs for CSAM.
 *
 * Runs Layer 1 (hash check) + Layer 4 (LLM image classifier) for every URL.
 * Returns the most severe flagged result, or a CLEAN result if all pass.
 * Never throws.
 *
 * @param input.urls    - Array of public image URLs (max MAX_IMAGES_PER_SCAN processed)
 * @param input.supabase - Supabase server client (for hash registry)
 */
export async function scanMediaUrlsForChildSafety(
  input: ScanMediaUrlsInput,
): Promise<ChildSafetyResult> {
  const { urls, supabase } = input;

  if (!urls || urls.length === 0) return cleanResult();

  // Cap the number of images to scan
  const imageUrls = urls.slice(0, MAX_IMAGES_PER_SCAN);

  // Load known-bad hashes once (shared across all images in this request)
  const knownBadHashes = await loadKnownBadHashes(supabase);

  let worstResult: ChildSafetyResult = cleanResult();

  for (const url of imageUrls) {
    try {
      // Validate that the URL is well-formed before fetching
      new URL(url);
    } catch {
      continue; // skip malformed URLs
    }

    const fetched = await fetchImageWithTimeout(url);
    if (!fetched) continue; // fetch failed or non-image — skip

    const { buffer, mime } = fetched;

    // ── Layer 1: Hash check ────────────────────────────────────────────────
    const imageHash = createHash('sha256').update(buffer).digest('hex');
    const hashResult = scanContent({
      mediaHashes: [imageHash],
      knownBadHashes,
    });

    if (hashResult.flagged) {
      // Hash match is the highest-priority signal — stop immediately
      return hashResult;
    }

    // ── Layer 4: LLM image classification ─────────────────────────────────
    const imageBase64 = buffer.toString('base64');
    const imgClassification = await classifyImage(imageBase64, mime ?? 'image/jpeg');

    const result = scanContent({ imageClassification: imgClassification });

    if (result.flagged && result.severity > worstResult.severity) {
      worstResult = result;
    }
  }

  return worstResult;
}

/**
 * isImageUrl — quick heuristic to filter URLs that are likely images.
 * Used by callers that receive mixed-type media arrays and want to skip
 * non-image URLs without fetching them.
 */
export function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const ext = pathname.split('.').pop() ?? '';
    return ext in EXT_TO_MIME || pathname.includes('/images/');
  } catch {
    return false;
  }
}
