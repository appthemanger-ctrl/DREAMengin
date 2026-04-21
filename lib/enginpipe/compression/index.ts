/**
 * lib/enginpipe/compression/index.ts
 *
 * Component 9 — Asset Compression Standards
 *
 * Defines the canonical format-selection policy for every asset type
 * produced or consumed by DREAMengin Engins.  No compression is performed
 * here — the module provides:
 *
 *   • `selectFormat(asset)` — pick the optimal encoding for an asset
 *   • `validateFormat(asset, format)` — enforce policy compliance
 *   • `CompressionPolicy` — the canonical table agents reference
 *
 * Canonical format map (docs/enginpipe/README.md §9):
 *
 *   Asset class     Preferred format   Fallback
 *   ────────────    ────────────────   ────────
 *   Raster image    AVIF               WebP
 *   Vector image    SVG                (none)
 *   Audio           Opus / OGG         MP4/AAC
 *   3-D geometry    Draco (glTF)       glTF plain
 *   Arbitrary data  Zstd               gzip
 *   Video           AV1 / WebM         H.264 / MP4
 *
 * Server-safe: pure TypeScript, no React, no DOM.
 *
 * Spec: docs/enginpipe/README.md §9
 */

// ─── Asset class ──────────────────────────────────────────────────────────────

export type AssetClass =
  | 'image-raster'
  | 'image-vector'
  | 'audio'
  | 'geometry-3d'
  | 'data'
  | 'video';

// ─── Format preference ────────────────────────────────────────────────────────

export interface FormatPreference {
  readonly preferred: string;
  readonly fallback?: string;
  /** MIME type for the preferred format. */
  readonly mimeType: string;
  /** File extension(s) for the preferred format. */
  readonly extensions: readonly string[];
  /** Nominal compression ratio vs. uncompressed source (informational). */
  readonly compressionRatioHint: number;
  /** Whether the format supports streaming / progressive decoding. */
  readonly supportsStreaming: boolean;
}

// ─── Compression policy table ─────────────────────────────────────────────────

/**
 * Canonical asset-class → format mapping.
 * Agents must reference this table rather than hard-coding format strings.
 */
export const COMPRESSION_POLICY: Readonly<Record<AssetClass, FormatPreference>> = {
  'image-raster': {
    preferred:            'avif',
    fallback:             'webp',
    mimeType:             'image/avif',
    extensions:           ['.avif', '.webp'],
    compressionRatioHint: 0.40,
    supportsStreaming:     false,
  },
  'image-vector': {
    preferred:            'svg+xml',
    mimeType:             'image/svg+xml',
    extensions:           ['.svg'],
    compressionRatioHint: 0.60,
    supportsStreaming:     true,
  },
  'audio': {
    preferred:            'opus',
    fallback:             'aac',
    mimeType:             'audio/ogg; codecs=opus',
    extensions:           ['.ogg', '.opus', '.m4a'],
    compressionRatioHint: 0.12,
    supportsStreaming:     true,
  },
  'geometry-3d': {
    preferred:            'draco',
    fallback:             'gltf',
    mimeType:             'model/gltf-binary',
    extensions:           ['.glb', '.gltf'],
    compressionRatioHint: 0.15,
    supportsStreaming:     false,
  },
  'data': {
    preferred:            'zstd',
    fallback:             'gzip',
    mimeType:             'application/zstd',
    extensions:           ['.zst', '.gz'],
    compressionRatioHint: 0.25,
    supportsStreaming:     true,
  },
  'video': {
    preferred:            'av1',
    fallback:             'h264',
    mimeType:             'video/webm; codecs=av01',
    extensions:           ['.webm', '.mp4'],
    compressionRatioHint: 0.08,
    supportsStreaming:     true,
  },
};

// ─── Asset descriptor ─────────────────────────────────────────────────────────

export interface AssetDescriptor {
  /** Asset class determines the format policy. */
  readonly assetClass: AssetClass;
  /**
   * Current encoding of the asset (before compression).
   * e.g. 'png', 'wav', 'json', 'mp4'.
   */
  readonly currentFormat?: string;
  /**
   * Estimated uncompressed byte size (optional, for size-budget checks).
   */
  readonly sizeBytes?: number;
}

// ─── Format selection ─────────────────────────────────────────────────────────

/**
 * Select the preferred encoding for an asset.
 *
 * If `useFallback` is true (e.g. when the runtime does not support the
 * preferred format) the fallback is returned instead.
 */
export function selectFormat(
  asset: AssetDescriptor,
  useFallback = false,
): FormatPreference {
  const policy = COMPRESSION_POLICY[asset.assetClass];
  if (useFallback && policy.fallback) {
    return {
      ...policy,
      preferred:  policy.fallback,
      extensions: policy.extensions.slice(1), // use the fallback extension
    };
  }
  return policy;
}

// ─── Compliance validation ────────────────────────────────────────────────────

export type FormatViolationReason =
  | 'wrong_format'       // neither preferred nor fallback
  | 'unknown_asset_class'; // assetClass not in COMPRESSION_POLICY

export interface FormatValidationResult {
  readonly compliant: boolean;
  readonly reason?: FormatViolationReason;
  readonly expected: readonly string[];
  readonly received: string;
}

/**
 * Validate that `actualFormat` is acceptable for `asset` given the policy.
 * Accepts both the preferred and fallback format.
 */
export function validateFormat(
  asset: AssetDescriptor,
  actualFormat: string,
): FormatValidationResult {
  const policy = COMPRESSION_POLICY[asset.assetClass];
  if (!policy) {
    return {
      compliant: false,
      reason:    'unknown_asset_class',
      expected:  [],
      received:  actualFormat,
    };
  }

  const normalised = actualFormat.toLowerCase().replace(/^\./, '');
  const accepted   = [
    policy.preferred,
    policy.fallback,
    ...policy.extensions.map((e) => e.replace(/^\./, '')),
  ].filter(Boolean) as string[];

  const compliant = accepted.some((f) => f === normalised);
  return {
    compliant,
    reason:   compliant ? undefined : 'wrong_format',
    expected: accepted,
    received: normalised,
  };
}

// ─── Size budget ──────────────────────────────────────────────────────────────

export interface SizeBudgetResult {
  readonly withinBudget: boolean;
  readonly estimatedCompressedBytes: number;
  readonly budgetBytes: number;
}

/**
 * Estimate whether an asset will fit within `budgetBytes` after compression.
 * Uses the policy's `compressionRatioHint` for the estimate.
 */
export function checkSizeBudget(
  asset: AssetDescriptor,
  budgetBytes: number,
): SizeBudgetResult {
  const policy   = COMPRESSION_POLICY[asset.assetClass];
  const rawBytes = asset.sizeBytes ?? 0;
  const estimated = Math.ceil(rawBytes * policy.compressionRatioHint);
  return {
    withinBudget:             estimated <= budgetBytes,
    estimatedCompressedBytes: estimated,
    budgetBytes,
  };
}
