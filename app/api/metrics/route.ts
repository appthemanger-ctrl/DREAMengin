// app/api/metrics/route.ts
//
// Prometheus-compatible /metrics endpoint.
//
// Returns OpenTelemetry-collected metrics in Prometheus exposition format.
// Protected by an optional Bearer token (METRICS_BEARER_TOKEN env var).
//
// When METRICS_BEARER_TOKEN is set:
//   Prometheus scrape config must include:
//     authorization:
//       credentials: <your-token>
//
// When METRICS_BEARER_TOKEN is unset (local dev / backwards compat):
//   The endpoint is open — acceptable only on localhost or Vercel IP-allowlisted deployments.
//
// This endpoint exposes ONLY system/service metrics — never user data, PII, or secrets.

import { NextRequest, NextResponse, connection } from 'next/server';
import { getPrometheusMetrics } from '@/lib/observability/otel';
import { initOtelBridge } from '@/lib/observability/otelBridge';

// Ensure the OTel bridge is active so all collector events are mirrored.
initOtelBridge();

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Optional Bearer token gate ───────────────────────────────────────────
  const expectedToken = process.env.METRICS_BEARER_TOKEN;
  if (expectedToken) {
    const authHeader = req.headers.get('authorization') ?? '';
    const providedToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (providedToken !== expectedToken) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="DREAMengin metrics"',
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  // Opt into dynamic rendering — metrics must be fresh on every scrape.
  await connection();

  const body = await getPrometheusMetrics();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}