# Observability — Production Telemetry

> **Owner:** infrastructure / platform team
> **Last updated:** 2026-04-13

DREAMengin ships with **production-grade, invisible telemetry** powered by
[OpenTelemetry](https://opentelemetry.io). All instrumentation runs under the
hood — there are no user-facing dashboards, panels, or widgets.

---

## Architecture

```
┌─────────────────────────┐
│  Next.js App (port 3000)│
│                         │
│  collectLog / Metric /  │──► OTel Bridge ──► Prometheus Exporter
│  collectTrace           │                    (in-process)
│                         │         ▲
│  GET /api/metrics ──────┼─────────┘   ← Prometheus scrapes this
└─────────────────────────┘
         │ (optional)
         ▼
   OTLP/HTTP Exporter
   → Grafana Cloud / Datadog / Honeycomb / Jaeger
```

### Components

| File | Purpose |
|---|---|
| `lib/observability/otel.ts` | OTel SDK singleton — MeterProvider + TracerProvider |
| `lib/observability/otelBridge.ts` | Bridges `collector.ts` ring-buffer events to OTel instruments |
| `lib/observability/collector.ts` | In-process ring buffers (unchanged API, now also forwards to OTel) |
| `app/api/metrics/route.ts` | `/api/metrics` — Prometheus exposition endpoint |
| `prometheus/prometheus.yml` | Prometheus scrape config |
| `grafana/datasources/prometheus.yml` | Auto-provisions Prometheus datasource in Grafana |

---

## Metrics exposed

All metrics have the `dreamengin_` prefix.

| Metric | Type | Description |
|---|---|---|
| `dreamengin_logs_total` | Counter | Log entries by `level` and `source` |
| `dreamengin_errors_total` | Counter | Error-level log entries |
| `dreamengin_custom_metric` | Histogram | Custom metric values from `collectMetric()` |
| `dreamengin_span_duration_ms` | Histogram | Span durations from `collectTrace()` |
| `dreamengin_active_requests` | UpDownCounter | In-flight requests |
| `dreamengin_process_uptime_seconds` | Gauge | Process uptime |
| `dreamengin_heap_used_bytes` | Gauge | V8 heap used |
| `dreamengin_heap_total_bytes` | Gauge | V8 heap total |
| `dreamengin_rss_bytes` | Gauge | Resident set size |
| `dreamengin_eventloop_lag_ms` | Gauge | Approximate event-loop lag |

---

## Quick start — local Docker Compose

```bash
docker compose up -d
```

This starts:

| Service | URL |
|---|---|
| **App** | http://localhost:3000 |
| **Prometheus** | http://localhost:9090 |
| **Grafana** | http://localhost:3001 (admin / admin) |

Prometheus automatically scrapes `http://app:3000/api/metrics` every 10 s.
Grafana auto-provisions the Prometheus datasource.

### Verify metrics are being collected

```bash
# Direct from the app
curl http://localhost:3000/api/metrics

# From Prometheus
curl 'http://localhost:9090/api/v1/query?query=dreamengin_process_uptime_seconds'
```

---

## Grafana dashboards

Grafana is pre-configured with Prometheus as the default datasource. You can:

1. Open http://localhost:3001
2. Navigate to **Explore** → select **Prometheus**
3. Query any `dreamengin_*` metric

To build a dashboard:

- **Request rate:** `rate(dreamengin_logs_total[5m])`
- **Error rate:** `rate(dreamengin_errors_total[5m])`
- **P95 latency:** `histogram_quantile(0.95, rate(dreamengin_span_duration_ms_bucket[5m]))`
- **Heap usage:** `dreamengin_heap_used_bytes`

---

## OTLP / external backends

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to send **traces** to any OTLP-compatible
backend:

```bash
# Grafana Cloud
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp

# Jaeger
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318

# Honeycomb
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
```

Traces are exported via OTLP/HTTP using `BatchSpanProcessor` for efficient
batching.

### Datadog

Datadog accepts OTLP natively via the Datadog Agent:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://datadog-agent:4318
```

Or use the Datadog Agent's Prometheus scraper to pull `/api/metrics`.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OTEL_SERVICE_NAME` | `dreamengin` | Service name in all exported signals |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(unset — traces stay local)* | OTLP/HTTP endpoint for traces |
| `OTEL_METRICS_EXPORTER` | `prometheus` | Set to `none` to disable metrics |

---

## Security / PII

- **Log messages are never exported.** Only log-level counts (debug/info/warn/error) are sent to OTel.
- **Metric names and labels** must not contain user content. All existing `collectMetric()` call sites use static names.
- **Trace span names** use route patterns (e.g. `POST /api/ai/idari`), never user input.
- The `/api/metrics` endpoint is unauthenticated by design (standard for Prometheus scraping). It exposes only system metrics — never user data.

---

## Disabling telemetry

Set `OTEL_METRICS_EXPORTER=none` to disable all metric collection and the
`/api/metrics` endpoint will return an empty response.

Traces are only exported when `OTEL_EXPORTER_OTLP_ENDPOINT` is set — if unset,
no traces leave the process.
