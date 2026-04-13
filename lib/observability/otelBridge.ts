// lib/observability/otelBridge.ts
//
// Bridges the in-process collector (ring buffers) to OpenTelemetry exporters.
//
// Call `initOtelBridge()` once at app startup (e.g. in instrumentation.ts or
// a top-level server module) to wire the existing collectMetric / collectLog /
// collectTrace calls to real OTel meters and spans so every signal is both
// kept in-process (for the IDARi correlator) and exported to Prometheus / OTLP.
//
// This module records **only** system-level signals — no PII, no user content.

import { SpanStatusCode, type Span } from '@opentelemetry/api';
import { getMeter, getTracer } from './otel';
import type { Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

// ── Singleton guard ───────────────────────────────────────────────────────────

let _bridgeReady = false;

// ── OTel instruments (created lazily) ─────────────────────────────────────────

let _logCounter: Counter | null = null;
let _metricGauge: Histogram | null = null;
let _traceHistogram: Histogram | null = null;
let _activeRequests: UpDownCounter | null = null;
let _errorCounter: Counter | null = null;

function ensureInstruments(): void {
  if (_logCounter) return;
  const meter = getMeter();

  _logCounter = meter.createCounter('dreamengin_logs_total', {
    description: 'Total log entries by level',
    unit: '1',
  });

  _errorCounter = meter.createCounter('dreamengin_errors_total', {
    description: 'Total error-level log entries',
    unit: '1',
  });

  _metricGauge = meter.createHistogram('dreamengin_custom_metric', {
    description: 'Custom metric values forwarded from the collector',
    unit: '1',
  });

  _traceHistogram = meter.createHistogram('dreamengin_span_duration_ms', {
    description: 'Span durations in milliseconds from the collector',
    unit: 'ms',
  });

  _activeRequests = meter.createUpDownCounter('dreamengin_active_requests', {
    description: 'Currently in-flight requests',
    unit: '1',
  });

  // Process-level metrics (heap, uptime)
  const processUptime = meter.createObservableGauge('dreamengin_process_uptime_seconds', {
    description: 'Process uptime in seconds',
    unit: 's',
  });
  processUptime.addCallback((result) => {
    result.observe(process.uptime());
  });

  const heapUsed = meter.createObservableGauge('dreamengin_heap_used_bytes', {
    description: 'Node.js heap used in bytes',
    unit: 'By',
  });
  heapUsed.addCallback((result) => {
    result.observe(process.memoryUsage().heapUsed);
  });

  const heapTotal = meter.createObservableGauge('dreamengin_heap_total_bytes', {
    description: 'Node.js heap total in bytes',
    unit: 'By',
  });
  heapTotal.addCallback((result) => {
    result.observe(process.memoryUsage().heapTotal);
  });

  const rss = meter.createObservableGauge('dreamengin_rss_bytes', {
    description: 'Resident set size in bytes',
    unit: 'By',
  });
  rss.addCallback((result) => {
    result.observe(process.memoryUsage().rss);
  });

  const eventLoopLag = meter.createObservableGauge('dreamengin_eventloop_lag_ms', {
    description: 'Approximate event loop lag in ms',
    unit: 'ms',
  });
  let _lastCheck = Date.now();
  const _lagInterval = setInterval(() => {
    const now = Date.now();
    const lag = now - _lastCheck - 1000;
    _lastCheck = now;
    // Store lag for the next observation
    (globalThis as Record<string, unknown>).__otel_event_loop_lag = Math.max(0, lag);
  }, 1000);
  if (_lagInterval.unref) _lagInterval.unref();
  eventLoopLag.addCallback((result) => {
    const lag = ((globalThis as Record<string, unknown>).__otel_event_loop_lag as number) ?? 0;
    result.observe(lag);
  });
}

// ── Bridge functions (called from patched collector) ──────────────────────────

/**
 * Forward a log entry to OTel metrics.
 * We record log counts by level as a counter — actual log content is NOT
 * exported to avoid leaking PII into the telemetry pipeline.
 */
export function otelRecordLog(level: string, source?: string): void {
  if (!_bridgeReady) return;
  ensureInstruments();
  const attrs: Record<string, string> = { level };
  if (source) attrs.source = source;
  _logCounter!.add(1, attrs);
  if (level === 'error') _errorCounter!.add(1, attrs);
}

/**
 * Forward a numeric metric to OTel.
 * The metric name and value are exported; labels are forwarded as-is
 * (callers are responsible for never passing PII as a label value).
 */
export function otelRecordMetric(
  name: string,
  value: number,
  labels?: Record<string, string>,
): void {
  if (!_bridgeReady) return;
  ensureInstruments();
  _metricGauge!.record(value, { metric_name: name, ...labels });
}

/**
 * Forward a completed trace span to OTel.
 * Creates a real OTel span with the correct duration and status.
 */
export function otelRecordTrace(
  name: string,
  durationMs: number,
  status: 'ok' | 'error' | 'timeout',
  tags?: Record<string, string>,
): void {
  if (!_bridgeReady) return;
  ensureInstruments();

  // Record as a histogram for Prometheus
  _traceHistogram!.record(durationMs, { span_name: name, status, ...tags });

  // Also create a real OTel span so traces export via OTLP
  const tracer = getTracer();
  const span: Span = tracer.startSpan(name, {
    startTime: new Date(Date.now() - durationMs),
    attributes: tags,
  });
  if (status === 'error') {
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'error' });
  } else if (status === 'timeout') {
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'timeout' });
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
  }
  span.end();
}

/** Increment the active request counter (call from middleware). */
export function otelRequestStart(): void {
  if (!_bridgeReady) return;
  ensureInstruments();
  _activeRequests!.add(1);
}

/** Decrement the active request counter (call from middleware). */
export function otelRequestEnd(): void {
  if (!_bridgeReady) return;
  ensureInstruments();
  _activeRequests!.add(-1);
}

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Activate the OTel bridge. Safe to call multiple times — only the first
 * call has an effect. After this, every collectLog / collectMetric /
 * collectTrace call in the collector will also emit OTel signals.
 */
export function initOtelBridge(): void {
  if (_bridgeReady) return;
  ensureInstruments();
  _bridgeReady = true;
}
