// app/api/metrics/route.ts
//
// Prometheus-compatible /metrics endpoint.
//
// Returns OpenTelemetry-collected metrics in Prometheus exposition format.
// This route is unauthenticated by design so Prometheus can scrape it
// without credentials. It exposes **only** system/service metrics — never
// user data, PII, or secrets.
//
// Scrape config example (prometheus.yml):
//   - job_name: 'dreamengin'
//     metrics_path: '/api/metrics'
//     static_configs:
//       - targets: ['app:3000']

import { NextResponse } from 'next/server';
import { getPrometheusMetrics } from '@/lib/observability/otel';
import { initOtelBridge } from '@/lib/observability/otelBridge';

// Ensure the OTel bridge is active so all collector events are mirrored.
initOtelBridge();

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const body = await getPrometheusMetrics();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
