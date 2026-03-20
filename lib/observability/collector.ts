// lib/observability/collector.ts
//
// In-process telemetry collector for the IDARi observability loop.
//
// Maintains three ring buffers (logs, metrics, traces) capped at MAX_ENTRIES
// each. Safe to call from any server or browser context.
//
// Part of the AI-assisted observability and remediation loop described in
// docs/ARCHITECTURE.md §13 and the IDARi system spec.

// ── Types ─────────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  /** Structured context — never contains secrets. */
  context?: Record<string, unknown>;
  /** Source component or file path hint. */
  source?: string;
}

export interface MetricPoint {
  id: string;
  timestamp: string;
  /** Metric name, e.g. 'api_latency_ms' or 'render_count'. */
  name: string;
  value: number;
  /** Optional label dimensions, e.g. { route: '/api/ai/idari' }. */
  labels?: Record<string, string>;
  unit?: string;
}

export interface TraceSpan {
  id: string;
  /** Groups related spans for one logical request. */
  trace_id: string;
  timestamp: string;
  /** Human-readable span name, e.g. 'POST /api/ai/idari'. */
  name: string;
  duration_ms: number;
  status: 'ok' | 'error' | 'timeout';
  tags?: Record<string, string>;
}

export interface TelemetrySnapshot {
  logs: LogEntry[];
  metrics: MetricPoint[];
  traces: TraceSpan[];
  /** ISO timestamp when the snapshot was taken. */
  collected_at: string;
}

// ── Ring buffer ───────────────────────────────────────────────────────────────

const MAX_ENTRIES = 500;

/** Module-level singletons — one collector per process. */
const logBuffer: LogEntry[] = [];
const metricBuffer: MetricPoint[] = [];
const traceBuffer: TraceSpan[] = [];

let _counter = 0;

function nextId(prefix: string): string {
  _counter += 1;
  return `${prefix}-${_counter}-${Date.now()}`;
}

function pushCapped<T>(buffer: T[], entry: T): void {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.shift();
  }
}

// ── Collection API ────────────────────────────────────────────────────────────

/**
 * Record a log entry in the observability collector.
 * Level 'error' and 'warn' entries are used by the correlator for anomaly detection.
 */
export function collectLog(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  source?: string,
): void {
  pushCapped(logBuffer, {
    id: nextId('log'),
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    source,
  });
}

/**
 * Record a numeric metric data point.
 * Used by the correlator to detect anomalies (sudden spikes / drops).
 */
export function collectMetric(
  name: string,
  value: number,
  labels?: Record<string, string>,
  unit?: string,
): void {
  pushCapped(metricBuffer, {
    id: nextId('met'),
    timestamp: new Date().toISOString(),
    name,
    value,
    labels,
    unit,
  });
}

/**
 * Record a completed trace span.
 * The correlator uses span duration and status to detect latency regressions.
 */
export function collectTrace(
  name: string,
  duration_ms: number,
  status: TraceSpan['status'],
  tags?: Record<string, string>,
  trace_id?: string,
): void {
  pushCapped(traceBuffer, {
    id: nextId('trc'),
    trace_id: trace_id ?? `trace-${Date.now()}`,
    timestamp: new Date().toISOString(),
    name,
    duration_ms,
    status,
    tags,
  });
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Return a snapshot of all telemetry within the last `windowMs` milliseconds.
 * Defaults to the last 5 minutes.
 */
export function getSnapshot(windowMs = 5 * 60 * 1000): TelemetrySnapshot {
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  return {
    logs: logBuffer.filter((e) => e.timestamp >= cutoff),
    metrics: metricBuffer.filter((e) => e.timestamp >= cutoff),
    traces: traceBuffer.filter((e) => e.timestamp >= cutoff),
    collected_at: new Date().toISOString(),
  };
}

/** Return current buffer sizes (total, not windowed). */
export function getBufferStats(): { logs: number; metrics: number; traces: number } {
  return {
    logs: logBuffer.length,
    metrics: metricBuffer.length,
    traces: traceBuffer.length,
  };
}

/** Flush all buffers — used in tests and manual resets. */
export function clearBuffers(): void {
  logBuffer.length = 0;
  metricBuffer.length = 0;
  traceBuffer.length = 0;
  _counter = 0;
}
