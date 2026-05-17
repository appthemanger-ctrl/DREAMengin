/**
 * lib/enginpipe/quality/tiers.ts
 *
 * Generic adaptive quality tier resolver. Mirrors §8 ("Performance
 * Budget & Quality Tier System") of the catalog. Pure functions so it
 * can be tested without a browser and reused by every Engin runtime.
 */

export type QualityTier = 'ultra' | 'high' | 'medium' | 'low';

export interface QualityTierConfig {
  max_asset_size: '4K' | '1080p' | '720p' | '480p';
  features: readonly string[];
  target_fps: 30 | 60 | 120;
}

/** Default tier table — matches the JSON in the catalog §8. */
export const DEFAULT_TIER_CONFIG: Readonly<Record<QualityTier, QualityTierConfig>> = {
  ultra:  { max_asset_size: '4K',    features: ['advanced_fx'], target_fps: 60 },
  high:   { max_asset_size: '1080p', features: ['basic_fx'],    target_fps: 60 },
  medium: { max_asset_size: '720p',  features: [],              target_fps: 60 },
  low:    { max_asset_size: '480p',  features: [],              target_fps: 30 },
};

/** Subset of `Navigator` we read from. Decoupled for testability. */
export interface CapabilityNavigator {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  userAgent?: string;
}

/** Subset of `screen` we read from. Decoupled for testability. */
export interface CapabilityScreen {
  width?: number;
  height?: number;
}

export interface CapabilityInput {
  navigator?: CapabilityNavigator | null;
  screen?: CapabilityScreen | null;
  /** Pre-computed GPU renderer string (e.g. "Apple M2", "Adreno 730"). */
  gpuRenderer?: string | null;
}

/**
 * Score the device on a 0-100 scale. Higher is better.
 *
 * Weighted sum of:
 *   - deviceMemory (0-40 pts; 8GB → full marks)
 *   - hardwareConcurrency (0-30 pts; 8 cores → full marks)
 *   - screen pixels (0-15 pts; 1920×1080 → full marks)
 *   - GPU keyword bonus (0-15 pts)
 */
export function scoreCapabilities(input: CapabilityInput = {}: number {
  const nav = input.navigator ?? null;
  const screen = input.screen ?? null;
  const gpu = (input.gpuRenderer ?? '').toLowerCase();

  const memGb = clamp(nav?.deviceMemory ?? 4, 0.5, 32);
  const cores = clamp(nav?.hardwareConcurrency ?? 4, 1, 32);
  const pixels = clamp(
    (screen?.width ?? 1280) * (screen?.height ?? 720),
    320 * 240,
    3840 * 2160,
  );

  const memScore = Math.min(40, (memGb / 8) * 40);
  const coreScore = Math.min(30, (cores / 8) * 30);
  const pixelScore = Math.min(15, (pixels / (1920 * 1080)) * 15);

  let gpuScore = 0;
  if (gpu) {
    if (/apple|m1|m2|m3|m4/.test(gpu)) gpuScore = 15;
    else if (/rtx|radeon rx|arc/.test(gpu)) gpuScore = 13;
    else if (/adreno (7|8)|mali-g7|mali-g9/.test(gpu)) gpuScore = 10;
    else if (/adreno|mali|powervr/.test(gpu)) gpuScore = 6;
    else gpuScore = 8;
  }

  return Math.round(memScore + coreScore + pixelScore + gpuScore);
}

/**
 * Map a capability score to a quality tier. Thresholds chosen so that
 * a typical desktop lands on `high`/`ultra`, mid-range mobile on
 * `medium`, and low-end mobile on `low`.
 */
export function tierFromScore(score: number: QualityTier {
  if (score >= 80) return 'ultra';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

/**
 * Detect the recommended quality tier for the current device.
 *
 * Pure function: pass in the bits of `navigator`/`screen` you want to
 * consider. In a browser, callers typically do:
 *
 *   detectCapabilityTier({ navigator, screen })
 */
export function detectCapabilityTier(input: CapabilityInput = {}: QualityTier {
  return tierFromScore(scoreCapabilities(input));
}

/** Look up the configuration for a tier. */
export function getTierConfig(tier: QualityTier: QualityTierConfig {
  return DEFAULT_TIER_CONFIG[tier];
}

function clamp(value: number, lo: number, hi: number: number {
  if (Number.isNaN(value)) return lo;
  return Math.max(lo, Math.min(hi, value));
}
