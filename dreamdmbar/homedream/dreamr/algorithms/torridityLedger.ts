export const TORRIDITY_LEDGER_CONFIG = {
  n: 2.1,
  a0: 1.2e-10,
  deltaP: 0.1,
  slopeMin: 0.6,
  slopeMax: 0.85,
  crossSimThreshold: 0.95,
  botScoreThreshold: 0.55,
} as const;

export interface HumanityPath {
  acceleration: number;
  time: number;
}

export interface OriginalityMeta {
  /** Unique words / total words in content (0–1). */
  uniqueWordRatio: number;
  /** True if the post contains original (non-aggregated) media. */
  hasOriginalMedia: boolean;
  /** Maximum cosine similarity to any known/syndicated content (0–1). */
  maxSimilarity: number;
}

export interface PostMassMeta {
  buildTime?: number;
  uniqueAssets?: number;
}

export interface SwipeReleaseSample {
  pixelDelta: number;
  crossDelta: number;
  durationMs: number;
  viewportExtent: number;
  direction: 'negative' | 'positive';
  triggerThresholdPx?: number;
}

export interface SwipeReleaseResult {
  shouldTrigger: boolean;
  locked: boolean;
  interactionDelta: number;
  releaseVelocity: number;
}

export interface TorridityPostLike {
  content?: string;
  media_url?: string | null;
  source?: string;
  provider?: string;
  views_count?: number;
}

/**
 * slog — signed logarithmic transform (natural ledger coordinate system).
 * slog(x) = sign(x) · ln(1 + |x|)
 *
 * Preserves sign, compresses large values, and is scale-invariant.
 * Applied to all deviations, velocities, and engagement metrics.
 */
export function slog(x: number): number {
  return Math.sign(x) * Math.log(1 + Math.abs(x));
}

export function getInteractionDelta(pixelDelta: number): number {
  return slog(pixelDelta);
}

export function getDeceleration(velocity: number): number {
  const sign = Math.sign(velocity);
  const x = Math.abs(velocity) / TORRIDITY_LEDGER_CONFIG.a0;
  const drift = x / Math.pow(1 + Math.pow(x, TORRIDITY_LEDGER_CONFIG.n), 1 / TORRIDITY_LEDGER_CONFIG.n);
  return sign * drift;
}

export function calculateSnapForce(distance: number, currentVelocity: number, viewportExtent: number): number {
  const snapZone = Math.max(viewportExtent * TORRIDITY_LEDGER_CONFIG.deltaP, 1);
  if (distance < snapZone) {
    const resistance = 0.85;
    const suction = (1 / Math.max(distance, 1)) * 10;
    return (currentVelocity * resistance) + suction;
  }
  return currentVelocity;
}

export function verifyHumanity(path: HumanityPath): boolean {
  if (!Number.isFinite(path.acceleration) || !Number.isFinite(path.time) || path.time <= 0) return false;
  const betaSlope = path.acceleration / path.time;
  return betaSlope >= TORRIDITY_LEDGER_CONFIG.slopeMin && betaSlope <= TORRIDITY_LEDGER_CONFIG.slopeMax;
}

export function getPostMass(meta: PostMassMeta): number {
  const effort = ((meta.buildTime ?? 0) * 0.5) + ((meta.uniqueAssets ?? 0) * 2.0);
  return Math.log(1 + Math.abs(effort));
}

export function normalizeHumanViews(viewsCount: number): number {
  const safeViews = Math.max(0, viewsCount);
  return TORRIDITY_LEDGER_CONFIG.a0 * (Math.log1p(safeViews + 1) / 4);
}

export function calculateRank({
  humanViews,
  metadata,
}: {
  humanViews: number;
  metadata: PostMassMeta;
}): number {
  const M = getPostMass(metadata);
  const V = normalizeHumanViews(humanViews);
  const x = (V * M) / TORRIDITY_LEDGER_CONFIG.a0;
  const weight = x / Math.pow(1 + Math.pow(x, TORRIDITY_LEDGER_CONFIG.n), 1 / TORRIDITY_LEDGER_CONFIG.n);
  return M < 1.5 ? Math.min(weight, TORRIDITY_LEDGER_CONFIG.deltaP) : weight;
}

export function derivePostMassMeta(post: TorridityPostLike): PostMassMeta {
  const content = post.content ?? '';
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const hasMedia = Boolean(post.media_url);
  const isNative = post.source === 'post' && (!post.provider || post.provider === 'dreamengin');
  const toolMention = /starmaker|dreamengin|gameengin|codeengin|labengin|brandingengin|contentengin/i.test(content);

  return {
    buildTime: Math.max(0.25, (words / 24) + (hasMedia ? 0.75 : 0) + (toolMention ? 0.5 : 0)),
    uniqueAssets: (hasMedia ? 1 : 0) + (isNative ? 1 : 0) + (toolMention ? 1 : 0),
  };
}

/**
 * Originality score — measures genuine creative effort.
 *
 * score = 0.4·slog(uniqueWordRatio) + 0.3·hasOriginalMedia + 0.3·slog(1 − maxSimilarity)
 *
 * Range is approximately 0–0.79 (not normalized to 1).
 */
export function calculateOriginality(meta: OriginalityMeta): number {
  const { uniqueWordRatio, hasOriginalMedia, maxSimilarity } = meta;
  return (
    0.4 * slog(Math.max(0, uniqueWordRatio)) +
    0.3 * (hasOriginalMedia ? 1 : 0) +
    0.3 * slog(Math.max(0, 1 - maxSimilarity))
  );
}

export function resolveSwipeRelease({
  pixelDelta,
  crossDelta,
  durationMs,
  viewportExtent,
  direction,
  triggerThresholdPx = 55,
}: SwipeReleaseSample): SwipeReleaseResult {
  const interactionDelta = getInteractionDelta(pixelDelta);
  const releaseVelocity = getDeceleration(pixelDelta / Math.max(durationMs, 1));
  const transformedThreshold = Math.abs(getInteractionDelta(triggerThresholdPx));
  const distanceToThreshold = Math.max(0, transformedThreshold - Math.abs(interactionDelta));
  const snapForce = calculateSnapForce(distanceToThreshold, Math.abs(releaseVelocity), Math.max(viewportExtent, 1));
  const isDominantAxis = Math.abs(pixelDelta) > Math.abs(crossDelta) * 1.2;
  const isCorrectDirection = direction === 'negative' ? pixelDelta < 0 : pixelDelta > 0;
  const clearsDistanceGate = Math.abs(pixelDelta) >= Math.max(28, triggerThresholdPx * 0.6);
  const clearsMotionGate = Math.abs(releaseVelocity) >= 0.1;
  const shouldTrigger = isDominantAxis &&
    isCorrectDirection &&
    clearsDistanceGate &&
    clearsMotionGate &&
    (Math.abs(interactionDelta) + Math.abs(snapForce) >= transformedThreshold);

  return {
    shouldTrigger,
    locked: shouldTrigger,
    interactionDelta,
    releaseVelocity: shouldTrigger ? 0 : releaseVelocity,
  };
}
