// lib/observability/otel.ts
//
// Production-grade OpenTelemetry initialisation for DREAMengin.
//
// Runs server-side only. Lazily initialised on first import so it is safe
// to import in any API route / middleware without double-init risk.
//
// Exports:
//   – getMeter()              → OTel Meter for custom metric instruments
//   – getTracer()             → OTel Tracer for custom spans
//   – getPrometheusMetrics()  → Prometheus exposition text for /api/metrics
//
// Environment knobs (all optional):
//   OTEL_SERVICE_NAME              – defaults to 'dreamengin'
//   OTEL_EXPORTER_OTLP_ENDPOINT   – if set, traces export via OTLP/HTTP
//   OTEL_METRICS_EXPORTER          – 'prometheus' (default) | 'none'

import { metrics, trace, type Meter, type Tracer } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { IncomingMessage, ServerResponse } from 'node:http';

// ── Singleton state ───────────────────────────────────────────────────────────

let _initialised = false;
let _promExporter: PrometheusExporter | null = null;
let _meter: Meter | null = null;
let _tracer: Tracer | null = null;

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'dreamengin';
const SERVICE_VERSION = process.env.npm_package_version ?? '2.0.0';

// ── Init ──────────────────────────────────────────────────────────────────────

function ensureInit(): void {
  if (_initialised) return;
  _initialised = true;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
  });

  // ── Metrics (Prometheus exporter) ──────────────────────────────────────────
  const metricsExporterEnv = process.env.OTEL_METRICS_EXPORTER ?? 'prometheus';

  if (metricsExporterEnv !== 'none') {
    _promExporter = new PrometheusExporter({
      preventServerStart: true, // we serve /api/metrics ourselves
    });
    const meterProvider = new MeterProvider({
      resource,
      readers: [_promExporter],
    });
    metrics.setGlobalMeterProvider(meterProvider);
  }

  // ── Traces (OTLP/HTTP when configured) ─────────────────────────────────────
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const spanProcessors = otlpEndpoint
    ? [new BatchSpanProcessor(new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }))]
    : [];

  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors,
  });
  tracerProvider.register();

  _meter = metrics.getMeter(SERVICE_NAME, SERVICE_VERSION);
  _tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Return the global OTel Meter (creates instruments lazily). */
export function getMeter(): Meter {
  ensureInit();
  return _meter!;
}

/** Return the global OTel Tracer (creates spans lazily). */
export function getTracer(): Tracer {
  ensureInit();
  return _tracer!;
}

/**
 * Collect Prometheus exposition text from the in-process exporter.
 * Returns an empty string when the Prometheus exporter is disabled.
 *
 * Uses the PrometheusExporter's built-in HTTP handler with a mock
 * request/response pair to capture the serialised metric text.
 */
export async function getPrometheusMetrics(): Promise<string> {
  ensureInit();
  if (!_promExporter) return '';

  return new Promise<string>((resolve) => {
    const fakeReq = {} as IncomingMessage;
    const fakeRes = {
      setHeader: () => fakeRes,
      writeHead: () => fakeRes,
      end: (data?: string) => resolve(data ?? ''),
    } as unknown as ServerResponse;

    _promExporter!.getMetricsRequestHandler(fakeReq, fakeRes);
  });
}
