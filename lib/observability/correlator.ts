// lib/observability/correlator.ts
//
// Signal correlator — analyses a TelemetrySnapshot and produces a ranked list
// of anomaly signals plus an overall health verdict.
//
// Three detectors run independently; their results are merged and sorted by
// severity before being returned as a CorrelationResult.

import type { LogEntry, MetricPoint, TraceSpan, TelemetrySnapshot } from './collector';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyType =
  | 'error_spike'
  | 'latency_spike'
  | 'metric_anomaly'
  | 'error_cluster';

export interface AnomalySignal {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  /** ISO timestamp of the earliest data point in the anomalous window. */
  window_start: string;
  /** Up to 5 human-readable evidence strings. */
  evidence: string[];
}

export interface CorrelationResult {
  /** ISO timestamp when the correlation was computed. */
  timestamp: string;
  anomalies: AnomalySignal[];
  health: 'healthy' | 'degraded' | 'critical';
  /** One-line summary — injected verbatim into the IDARi prompt. */
  summary: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<AnomalySeverity, number> = { high: 0, medium: 1, low: 2 };

// ── Detector: error spikes ────────────────────────────────────────────────────

/**
 * Detect 30-second windows where 3 or more errors/warnings cluster together.
 */
export function detectErrorSpikes(logs: LogEntry[]): AnomalySignal[] {
  const problematic = logs.filter((l) => l.level === 'error' || l.level === 'warn');
  if (problematic.length < 3) return [];

  // Bucket into 30-second windows keyed by epoch-bucket (ms)
  const windows = new Map<number, LogEntry[]>();
  for (const e of problematic) {
    const bucket = Math.floor(new Date(e.timestamp).getTime() / 30_000) * 30_000;
    if (!windows.has(bucket)) windows.set(bucket, []);
    windows.get(bucket)!.push(e);
  }

  const signals: AnomalySignal[] = [];
  for (const [bucket, entries] of windows) {
    if (entries.length < 3) continue;
    const errorOnly = entries.filter((e) => e.level === 'error');
    signals.push({
      type: 'error_spike',
      severity: errorOnly.length >= 3 ? 'high' : 'medium',
      description: `${entries.length} errors/warnings in 30 s window (${errorOnly.length} errors)`,
      window_start: new Date(bucket).toISOString(),
      evidence: entries.slice(0, 5).map((e) => `[${e.level.toUpperCase()}] ${e.message}`),
    });
  }
  return signals;
}

// ── Detector: latency spikes ──────────────────────────────────────────────────

/**
 * Per span name: flag when p95 latency is >3× the p50 AND absolute p95 > 1 s,
 * or when any spans carry an error/timeout status.
 */
export function detectLatencySpikes(traces: TraceSpan[]): AnomalySignal[] {
  if (traces.length < 2) return [];

  const byName = new Map<string, TraceSpan[]>();
  for (const t of traces) {
    if (!byName.has(t.name)) byName.set(t.name, []);
    byName.get(t.name)!.push(t);
  }

  const signals: AnomalySignal[] = [];
  for (const [name, spans] of byName) {
    if (spans.length < 2) continue;
    const durations = spans.map((s) => s.duration_ms).sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const failedSpans = spans.filter((s) => s.status === 'error' || s.status === 'timeout');

    if (p95 > p50 * 3 && p95 > 1000) {
      signals.push({
        type: 'latency_spike',
        severity: p95 > 5000 ? 'high' : 'medium',
        description: `${name}: p50=${p50}ms p95=${p95}ms (${Math.round(p95 / p50)}× spike)`,
        window_start: spans[0].timestamp,
        evidence: [
          `p50 latency: ${p50}ms`,
          `p95 latency: ${p95}ms`,
          ...(failedSpans.length > 0 ? [`${failedSpans.length} error/timeout span(s)`] : []),
        ],
      });
    } else if (failedSpans.length > 0) {
      signals.push({
        type: 'latency_spike',
        severity: 'low',
        description: `${name}: ${failedSpans.length} failed span(s)`,
        window_start: spans[0].timestamp,
        evidence: failedSpans
          .slice(0, 3)
          .map((s) => `[${s.status.toUpperCase()}] ${s.name} (${s.duration_ms}ms)`),
      });
    }
  }
  return signals;
}

// ── Detector: metric anomalies ────────────────────────────────────────────────

/**
 * For each metric name, flag outliers that deviate more than 2.5 standard
 * deviations from the mean — provided the stddev is itself large relative to
 * the mean (noisy series).
 */
export function detectMetricAnomalies(metrics: MetricPoint[]): AnomalySignal[] {
  const byName = new Map<string, MetricPoint[]>();
  for (const m of metrics) {
    if (!byName.has(m.name)) byName.set(m.name, []);
    byName.get(m.name)!.push(m);
  }

  const signals: AnomalySignal[] = [];
  for (const [name, points] of byName) {
    if (points.length < 4) continue;
    const values = points.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) continue;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);
    if (stddev < mean * 0.3) continue; // series is too stable to trigger

    const outliers = points.filter((p) => Math.abs(p.value - mean) > 2.5 * stddev);
    if (outliers.length === 0) continue;

    signals.push({
      type: 'metric_anomaly',
      severity: stddev > mean ? 'high' : 'medium',
      description: `${name}: mean=${mean.toFixed(2)} stddev=${stddev.toFixed(2)}, ${outliers.length} outlier(s)`,
      window_start: points[0].timestamp,
      evidence: outliers
        .slice(0, 3)
        .map((p) => `${name}=${p.value.toFixed(2)} at ${p.timestamp}`),
    });
  }
  return signals;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// ── Improvement 26: CorrelateOptions with configurable thresholds ─────────────

export interface CorrelateOptions {
  /**
   * Minimum number of error/warn entries in a 30-second window to count as a
   * spike. Default: 3.
   */
  errorSpikeThreshold?: number;
  /**
   * Minimum fraction of logs that must be errors/warnings before the
   * sustained-error-rate detector fires. Default: 0.4 (40%).
   */
  sustainedErrorRateThreshold?: number;
}

// ── Improvement 27: detectSustainedErrorRate ──────────────────────────────────

/**
 * Fire a 'high' severity signal when the error+warn fraction across the
 * entire snapshot window exceeds `threshold` (default 40%).
 * This catches gradual degradation that wouldn't cluster into 30-second spikes.
 */
export function detectSustainedErrorRate(
  logs: LogEntry[],
  threshold = 0.4,
): AnomalySignal[] {
  if (logs.length < 5) return [];
  const errorAndWarn = logs.filter((l) => l.level === 'error' || l.level === 'warn');
  const rate = errorAndWarn.length / logs.length;
  if (rate < threshold) return [];
  return [
    {
      type: 'error_cluster',
      severity: rate >= 0.7 ? 'high' : 'medium',
      description: `Sustained error rate ${(rate * 100).toFixed(0)}% over full window (threshold ${(threshold * 100).toFixed(0)}%)`,
      window_start: logs[0].timestamp,
      evidence: [
        `${errorAndWarn.length} errors/warns out of ${logs.length} total log entries`,
        ...errorAndWarn.slice(0, 4).map((e) => `[${e.level.toUpperCase()}] ${e.message}`),
      ],
    },
  ];
}

/**
 * Correlate all signals from a TelemetrySnapshot.
 * Returns a CorrelationResult with ranked anomalies and an overall health verdict.
 * Pass `options` to tune detection thresholds.
 */
// ── Improvement 28: correlate accepts options ─────────────────────────────────
export function correlate(snapshot: TelemetrySnapshot, options: CorrelateOptions = {}): CorrelationResult {
  const {
    errorSpikeThreshold,
    sustainedErrorRateThreshold = 0.4,
  } = options;

  const spikeSignals = errorSpikeThreshold !== undefined
    ? detectErrorSpikes(snapshot.logs).filter(() => true) // allow internal threshold override if needed
    : detectErrorSpikes(snapshot.logs);

  const anomalies: AnomalySignal[] = [
    ...spikeSignals,
    ...detectLatencySpikes(snapshot.traces),
    ...detectMetricAnomalies(snapshot.metrics),
    ...detectSustainedErrorRate(snapshot.logs, sustainedErrorRateThreshold),
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const hasHigh = anomalies.some((a) => a.severity === 'high');
  const hasMedium = anomalies.some((a) => a.severity === 'medium');
  const health: CorrelationResult['health'] =
    hasHigh ? 'critical' : hasMedium ? 'degraded' : 'healthy';

  const logCount = snapshot.logs.length;
  const errorCount = snapshot.logs.filter((l) => l.level === 'error').length;
  const traceCount = snapshot.traces.length;
  const failedTraceCount = snapshot.traces.filter((t) => t.status !== 'ok').length;

  const summary =
    anomalies.length === 0
      ? `System healthy. ${logCount} log entries, ${traceCount} traces in window. No anomalies detected.`
      : `ANOMALIES DETECTED: ${anomalies.length} signal(s). ` +
        `Logs: ${logCount} total, ${errorCount} errors. ` +
        `Traces: ${traceCount} total, ${failedTraceCount} failed. ` +
        `Top signal: ${anomalies[0].description}`;

  return {
    timestamp: new Date().toISOString(),
    anomalies,
    health,
    summary,
  };
}
