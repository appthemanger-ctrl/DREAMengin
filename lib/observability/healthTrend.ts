/**
 * lib/observability/healthTrend.ts
 *
 * Rolling health trend analysis for the IDARi observability loop.
 *
 * Improvements 76-80:
 *  76. updateHealthTrend   — push a health status into a rolling window
 *  77. getHealthTrend      — 'improving' | 'stable' | 'degrading'
 *  78. getHealthScore      — 0-100 score from recent iterations
 *  79. getMTTR             — mean time to recovery (failed → resolved)
 *  80. exportHealthReport  — structured report for export / dashboards
 */

import type { LoopIteration, LoopStatus } from '@/lib/agents/idariLoop';

// ── Improvement 76: updateHealthTrend / rolling state ─────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface HealthDataPoint {
  status: HealthStatus;
  timestamp: number;
}

const MAX_TREND_WINDOW = 100;
const _trendBuffer: HealthDataPoint[] = [];

/**
 * Push a health status data point into the rolling trend window.
 * At most MAX_TREND_WINDOW points are kept; oldest are evicted first.
 */
export function updateHealthTrend(status: HealthStatus): void {
  _trendBuffer.push({ status, timestamp: Date.now() });
  if (_trendBuffer.length > MAX_TREND_WINDOW) {
    _trendBuffer.shift();
  }
}

/** Reset the trend buffer — for tests and explicit resets. */
export function clearHealthTrend(): void {
  _trendBuffer.length = 0;
}

// ── Improvement 77: getHealthTrend ────────────────────────────────────────────

export type HealthTrend = 'improving' | 'stable' | 'degrading';

/**
 * Compute a trend from the last `windowSize` data points.
 * Compares the error rate of the first half vs the second half of the window.
 *
 * - 'improving': fewer unhealthy statuses in the second half
 * - 'degrading': more unhealthy statuses in the second half
 * - 'stable': no significant change
 */
export function getHealthTrend(windowSize = 20): HealthTrend {
  const recent = _trendBuffer.slice(-Math.min(windowSize, _trendBuffer.length));
  if (recent.length < 4) return 'stable';

  const half = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, half);
  const secondHalf = recent.slice(half);

  const unhealthyRate = (points: HealthDataPoint[]) =>
    points.filter((p) => p.status !== 'healthy').length / points.length;

  const firstRate = unhealthyRate(firstHalf);
  const secondRate = unhealthyRate(secondHalf);
  const delta = secondRate - firstRate;

  if (delta < -0.1) return 'improving';
  if (delta > 0.1) return 'degrading';
  return 'stable';
}

// ── Improvement 78: getHealthScore ────────────────────────────────────────────

/**
 * Compute a 0-100 health score from recent loop iterations.
 * 100 = all iterations resolved, 0 = all iterations failed.
 * Score is weighted toward recency (more recent iterations count more).
 */
export function getHealthScore(iterations: readonly LoopIteration[]): number {
  if (iterations.length === 0) return 100; // no data = assume healthy
  const recent = iterations.slice(-20); // use at most last 20 iterations
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < recent.length; i++) {
    const weight = i + 1; // more recent = higher weight
    const score = recent[i].status === 'resolved' ? 100 : recent[i].status === 'failed' ? 0 : 50;
    weightedSum += score * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
}

// ── Improvement 79: getMTTR ───────────────────────────────────────────────────

/**
 * Compute the Mean Time To Recovery (MTTR) in milliseconds.
 *
 * MTTR is defined as the average time between a 'failed' iteration and the
 * next 'resolved' iteration. Returns null when there are no recovery events.
 */
export function getMTTR(iterations: readonly LoopIteration[]): number | null {
  const recoveryTimes: number[] = [];

  for (let i = 0; i < iterations.length - 1; i++) {
    const curr = iterations[i];
    const next = iterations[i + 1];
    if (curr.status === 'failed' && next.status === 'resolved') {
      const failedAt = new Date(curr.started_at).getTime();
      const resolvedAt = new Date(next.finished_at ?? next.started_at).getTime();
      if (resolvedAt > failedAt) {
        recoveryTimes.push(resolvedAt - failedAt);
      }
    }
  }

  if (recoveryTimes.length === 0) return null;
  return recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
}

// ── Improvement 80: exportHealthReport ───────────────────────────────────────

export interface HealthReport {
  generatedAt: string;
  iterationCount: number;
  resolvedCount: number;
  failedCount: number;
  successRate: number;
  healthScore: number;
  trend: HealthTrend;
  mttrMs: number | null;
  lastStatus: LoopStatus | null;
  topAnomalies: string[];
}

/**
 * Produce a structured health report from recent loop iterations.
 * Suitable for export to a monitoring dashboard or log aggregation system.
 */
export function exportHealthReport(iterations: readonly LoopIteration[]): HealthReport {
  const resolved = iterations.filter((i) => i.status === 'resolved').length;
  const failed = iterations.filter((i) => i.status === 'failed').length;
  const lastStatus = iterations.length > 0 ? iterations[iterations.length - 1].status : null;

  // Collect the most common anomaly types across all iterations
  const anomalyCounts = new Map<string, number>();
  for (const iter of iterations) {
    for (const anomaly of iter.correlation.anomalies) {
      anomalyCounts.set(anomaly.type, (anomalyCounts.get(anomaly.type) ?? 0) + 1);
    }
  }
  const topAnomalies = Array.from(anomalyCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => `${type} (×${count})`);

  return {
    generatedAt: new Date().toISOString(),
    iterationCount: iterations.length,
    resolvedCount: resolved,
    failedCount: failed,
    successRate: iterations.length > 0 ? resolved / iterations.length : 0,
    healthScore: getHealthScore(iterations),
    trend: getHealthTrend(),
    mttrMs: getMTTR(iterations),
    lastStatus,
    topAnomalies,
  };
}
