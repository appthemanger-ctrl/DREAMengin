/**
 * lib/runtime/channelMetrics.ts
 *
 * Per-channel emission and error metrics for the DualRuntimeBridge.
 *
 * Improvements 68-72:
 *  68. recordEmission  — track emission count + optional latency per channel
 *  69. recordError     — track errors per channel
 *  70. getChannelMetrics — returns stats for one channel
 *  71. getAllChannelMetrics — snapshot of all channels
 *  72. resetChannelMetrics — for testing
 *
 * Usage:
 *   import { recordEmission, getChannelMetrics } from '@/lib/runtime/channelMetrics';
 *
 *   // In the bridge emit path:
 *   recordEmission('music', 12);
 *
 *   // In a health dashboard:
 *   const stats = getChannelMetrics('music');
 *   // { emissionCount: 1, errorCount: 0, avgLatencyMs: 12, lastActivityAt: ... }
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ChannelMetrics {
  /** Channel identifier. */
  channel: string;
  /** Total number of emissions recorded. */
  emissionCount: number;
  /** Total number of errors recorded on this channel. */
  errorCount: number;
  /**
   * Running average of emission latency in ms.
   * Only meaningful when latency values are passed to recordEmission().
   * Returns 0 when no latency data has been recorded.
   */
  avgLatencyMs: number;
  /** Epoch ms of the last recordEmission or recordError call, or null. */
  lastActivityAt: number | null;
}

// ── Internal state ─────────────────────────────────────────────────────────────

interface _ChannelState {
  emissionCount: number;
  errorCount: number;
  totalLatencyMs: number;
  latencySamples: number;
  lastActivityAt: number | null;
}

const _state = new Map<string, _ChannelState>();

function _ensure(channel: string): _ChannelState {
  let s = _state.get(channel);
  if (!s) {
    s = { emissionCount: 0, errorCount: 0, totalLatencyMs: 0, latencySamples: 0, lastActivityAt: null };
    _state.set(channel, s);
  }
  return s;
}

// ── Improvement 68: recordEmission ────────────────────────────────────────────

/**
 * Record an emission on `channel`.
 * Optionally provide a latency measurement in ms to track average latency.
 */
export function recordEmission(channel: string, latencyMs?: number): void {
  const s = _ensure(channel);
  s.emissionCount++;
  s.lastActivityAt = Date.now();
  if (latencyMs !== undefined && isFinite(latencyMs) && latencyMs >= 0) {
    s.totalLatencyMs += latencyMs;
    s.latencySamples++;
  }
}

// ── Improvement 69: recordError ───────────────────────────────────────────────

/**
 * Record an error on `channel`.
 * Increments both the error count and the last-activity timestamp.
 */
export function recordError(channel: string): void {
  const s = _ensure(channel);
  s.errorCount++;
  s.lastActivityAt = Date.now();
}

// ── Improvement 70: getChannelMetrics ─────────────────────────────────────────

/**
 * Return the current metrics for a single channel.
 * Returns zeroed metrics when the channel has never been used.
 */
export function getChannelMetrics(channel: string): ChannelMetrics {
  const s = _state.get(channel);
  if (!s) {
    return { channel, emissionCount: 0, errorCount: 0, avgLatencyMs: 0, lastActivityAt: null };
  }
  return {
    channel,
    emissionCount: s.emissionCount,
    errorCount: s.errorCount,
    avgLatencyMs: s.latencySamples > 0 ? s.totalLatencyMs / s.latencySamples : 0,
    lastActivityAt: s.lastActivityAt,
  };
}

// ── Improvement 71: getAllChannelMetrics ──────────────────────────────────────

/**
 * Return a snapshot of metrics for every channel that has been used.
 * Sorted by emission count descending (most active first).
 */
export function getAllChannelMetrics(): ChannelMetrics[] {
  return Array.from(_state.keys())
    .map(getChannelMetrics)
    .sort((a, b) => b.emissionCount - a.emissionCount);
}

// ── Improvement 72: resetChannelMetrics ──────────────────────────────────────

/**
 * Clear all recorded metrics.
 * Intended for test teardown and explicit reset scenarios.
 */
export function resetChannelMetrics(): void {
  _state.clear();
}
