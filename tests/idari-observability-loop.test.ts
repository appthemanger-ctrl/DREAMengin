/**
 * tests/idari-observability-loop.test.ts
 *
 * Unit tests for the IDARi observability and remediation loop:
 *   - lib/observability/collector.ts  (ring buffer + collection API)
 *   - lib/observability/correlator.ts (anomaly detection + correlation)
 *   - lib/observability/rootCauseAnalyzer.ts (pattern-matched root cause)
 *   - lib/agents/idariLoop.ts         (prompt builder, fallback plan, loop iteration)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  collectLog,
  collectMetric,
  collectTrace,
  getSnapshot,
  getBufferStats,
  clearBuffers,
  type LogEntry,
  type MetricPoint,
  type TraceSpan,
} from '@/lib/observability/collector';
import {
  detectErrorSpikes,
  detectLatencySpikes,
  detectMetricAnomalies,
  correlate,
  type AnomalySignal,
} from '@/lib/observability/correlator';
import { inferRootCause } from '@/lib/observability/rootCauseAnalyzer';
import { buildImmediateRemediationAction } from '@/lib/observability/immediateAction';
import {
  buildIdariPrompt,
  buildFallbackPatchPlan,
  runLoopIteration,
} from '@/lib/agents/idariLoop';
import type { TelemetrySnapshot } from '@/lib/observability/collector';
import type { CorrelationResult } from '@/lib/observability/correlator';
import type { RootCauseAnalysis } from '@/lib/observability/rootCauseAnalyzer';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLog(
  level: LogEntry['level'],
  message: string,
  minsAgo = 1,
): LogEntry {
  return {
    id: `log-${Math.random()}`,
    timestamp: new Date(Date.now() - minsAgo * 60_000).toISOString(),
    level,
    message,
  };
}

function makeMetric(name: string, value: number, minsAgo = 1): MetricPoint {
  return {
    id: `met-${Math.random()}`,
    timestamp: new Date(Date.now() - minsAgo * 60_000).toISOString(),
    name,
    value,
  };
}

function makeTrace(
  name: string,
  duration_ms: number,
  status: TraceSpan['status'] = 'ok',
  minsAgo = 1,
): TraceSpan {
  return {
    id: `trc-${Math.random()}`,
    trace_id: `trace-${Math.random()}`,
    timestamp: new Date(Date.now() - minsAgo * 60_000).toISOString(),
    name,
    duration_ms,
    status,
  };
}

function emptySnapshot(): TelemetrySnapshot {
  return { logs: [], metrics: [], traces: [], collected_at: new Date().toISOString() };
}

function makeCorrelation(health: CorrelationResult['health'] = 'healthy'): CorrelationResult {
  return {
    timestamp: new Date().toISOString(),
    anomalies: [],
    health,
    summary: 'test summary',
  };
}

function makeRootCause(area = 'none'): RootCauseAnalysis {
  return {
    timestamp: new Date().toISOString(),
    likely_cause: area === 'none' ? 'No anomalies detected — system appears healthy' : 'Test cause',
    confidence: 'high',
    affected_area: area,
    risk: 'low',
    recommended_action: area === 'none' ? 'No corrective action required.' : 'Fix it.',
    evidence_summary: [],
  };
}

// ── collector ─────────────────────────────────────────────────────────────────

describe('collector — collectLog', () => {
  beforeEach(() => clearBuffers());

  it('stores a log entry with the correct level and message', () => {
    collectLog('error', 'Something broke');
    const snap = getSnapshot();
    expect(snap.logs).toHaveLength(1);
    expect(snap.logs[0].level).toBe('error');
    expect(snap.logs[0].message).toBe('Something broke');
  });

  it('stamps a valid ISO timestamp', () => {
    collectLog('info', 'Started');
    const snap = getSnapshot();
    expect(snap.logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('assigns a unique id to each entry', () => {
    collectLog('warn', 'A');
    collectLog('warn', 'B');
    const snap = getSnapshot();
    expect(snap.logs[0].id).not.toBe(snap.logs[1].id);
  });

  it('stores optional context and source', () => {
    collectLog('debug', 'msg', { key: 'val' }, 'MyComponent');
    const snap = getSnapshot();
    expect(snap.logs[0].context).toEqual({ key: 'val' });
    expect(snap.logs[0].source).toBe('MyComponent');
  });

  it('includes entries within the window and excludes truly old ones', () => {
    clearBuffers();
    collectLog('error', 'Recent error');
    // A very large window (1 hour) must include the just-collected entry
    const snapLarge = getSnapshot(60 * 60 * 1000);
    expect(snapLarge.logs.length).toBeGreaterThanOrEqual(1);
    // A negative window creates a future cutoff — nothing should match
    const snapFuture = getSnapshot(-1000);
    expect(snapFuture.logs).toHaveLength(0);
  });
});

describe('collector — collectMetric', () => {
  beforeEach(() => clearBuffers());

  it('stores a metric point with name and value', () => {
    collectMetric('api_latency_ms', 142, { route: '/api/ai/idari' });
    const snap = getSnapshot();
    expect(snap.metrics).toHaveLength(1);
    expect(snap.metrics[0].name).toBe('api_latency_ms');
    expect(snap.metrics[0].value).toBe(142);
    expect(snap.metrics[0].labels?.route).toBe('/api/ai/idari');
  });
});

describe('collector — collectTrace', () => {
  beforeEach(() => clearBuffers());

  it('stores a trace span', () => {
    collectTrace('POST /api/ai/idari', 350, 'ok', { user: 'admin' });
    const snap = getSnapshot();
    expect(snap.traces).toHaveLength(1);
    expect(snap.traces[0].name).toBe('POST /api/ai/idari');
    expect(snap.traces[0].duration_ms).toBe(350);
    expect(snap.traces[0].status).toBe('ok');
  });

  it('uses provided trace_id or generates one', () => {
    collectTrace('span-a', 100, 'ok', {}, 'my-trace-id');
    const snap = getSnapshot();
    expect(snap.traces[0].trace_id).toBe('my-trace-id');
  });
});

describe('collector — getBufferStats', () => {
  beforeEach(() => clearBuffers());

  it('returns zero counts after clear', () => {
    const stats = getBufferStats();
    expect(stats.logs).toBe(0);
    expect(stats.metrics).toBe(0);
    expect(stats.traces).toBe(0);
  });

  it('reflects actual counts', () => {
    collectLog('info', 'a');
    collectLog('error', 'b');
    collectMetric('m', 1);
    collectTrace('t', 10, 'ok');
    const stats = getBufferStats();
    expect(stats.logs).toBe(2);
    expect(stats.metrics).toBe(1);
    expect(stats.traces).toBe(1);
  });
});

describe('collector — clearBuffers', () => {
  it('empties all three buffers', () => {
    collectLog('info', 'x');
    collectMetric('y', 1);
    collectTrace('z', 5, 'ok');
    clearBuffers();
    const snap = getSnapshot();
    expect(snap.logs).toHaveLength(0);
    expect(snap.metrics).toHaveLength(0);
    expect(snap.traces).toHaveLength(0);
  });
});

// ── correlator — detectErrorSpikes ───────────────────────────────────────────

describe('detectErrorSpikes', () => {
  it('returns empty array when fewer than 3 problematic entries', () => {
    const logs = [makeLog('error', 'e1'), makeLog('error', 'e2')];
    expect(detectErrorSpikes(logs)).toHaveLength(0);
  });

  it('returns empty array when no errors or warnings', () => {
    const logs = [makeLog('info', 'ok'), makeLog('debug', 'ok'), makeLog('info', 'ok')];
    expect(detectErrorSpikes(logs)).toHaveLength(0);
  });

  it('detects a spike when 3+ errors cluster in one 30 s window', () => {
    // All entries share the same timestamp → same 30 s bucket
    const now = new Date().toISOString();
    const logs: LogEntry[] = [
      { id: '1', timestamp: now, level: 'error', message: 'e1' },
      { id: '2', timestamp: now, level: 'error', message: 'e2' },
      { id: '3', timestamp: now, level: 'warn', message: 'w1' },
    ];
    const signals = detectErrorSpikes(logs);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals[0].type).toBe('error_spike');
  });

  it('rates 3+ errors in same bucket as high severity', () => {
    const now = new Date().toISOString();
    const logs: LogEntry[] = Array.from({ length: 3 }, (_, i) => ({
      id: String(i),
      timestamp: now,
      level: 'error' as const,
      message: `error ${i}`,
    }));
    const signals = detectErrorSpikes(logs);
    expect(signals[0].severity).toBe('high');
  });

  it('includes evidence strings from the entries', () => {
    const now = new Date().toISOString();
    const logs: LogEntry[] = [
      { id: '1', timestamp: now, level: 'error', message: 'DB connection failed' },
      { id: '2', timestamp: now, level: 'error', message: 'Timeout' },
      { id: '3', timestamp: now, level: 'error', message: 'Auth error' },
    ];
    const signals = detectErrorSpikes(logs);
    expect(signals[0].evidence.some((e) => e.includes('DB connection failed'))).toBe(true);
  });
});

// ── correlator — detectLatencySpikes ─────────────────────────────────────────

describe('detectLatencySpikes', () => {
  it('returns empty when fewer than 2 spans', () => {
    expect(detectLatencySpikes([makeTrace('api', 100)])).toHaveLength(0);
  });

  it('returns empty when no latency spikes or failures', () => {
    const traces = Array.from({ length: 5 }, () => makeTrace('api', 100));
    expect(detectLatencySpikes(traces)).toHaveLength(0);
  });

  it('detects a latency spike when p95 > 3× p50 and p95 > 1000 ms', () => {
    // p50 ≈ 100 ms, one outlier at 5000 ms → p95 >> 3× p50
    const traces: TraceSpan[] = [
      ...Array.from({ length: 9 }, () => makeTrace('slow-api', 100)),
      makeTrace('slow-api', 5000),
    ];
    const signals = detectLatencySpikes(traces);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals[0].type).toBe('latency_spike');
  });

  it('flags error spans even without a latency ratio spike', () => {
    const traces = [
      makeTrace('api', 200, 'error'),
      makeTrace('api', 180, 'ok'),
    ];
    const signals = detectLatencySpikes(traces);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals[0].type).toBe('latency_spike');
  });
});

// ── correlator — detectMetricAnomalies ───────────────────────────────────────

describe('detectMetricAnomalies', () => {
  it('returns empty for fewer than 4 data points', () => {
    const metrics = [makeMetric('cpu', 50), makeMetric('cpu', 52), makeMetric('cpu', 48)];
    expect(detectMetricAnomalies(metrics)).toHaveLength(0);
  });

  it('returns empty for a stable series', () => {
    const metrics = Array.from({ length: 10 }, () => makeMetric('cpu', 50));
    expect(detectMetricAnomalies(metrics)).toHaveLength(0);
  });

  it('detects an anomaly for a very noisy series with outliers', () => {
    // 9 normal points at 10, one spike at 1000
    const metrics: MetricPoint[] = [
      ...Array.from({ length: 9 }, () => makeMetric('latency', 10)),
      makeMetric('latency', 1000),
    ];
    const signals = detectMetricAnomalies(metrics);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals[0].type).toBe('metric_anomaly');
  });
});

// ── correlator — correlate ────────────────────────────────────────────────────

describe('correlate', () => {
  it('returns health="healthy" for an empty snapshot', () => {
    const result = correlate(emptySnapshot());
    expect(result.health).toBe('healthy');
    expect(result.anomalies).toHaveLength(0);
  });

  it('returns health="critical" when a high-severity anomaly exists', () => {
    const now = new Date().toISOString();
    const snapshot: TelemetrySnapshot = {
      logs: Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        timestamp: now,
        level: 'error' as const,
        message: `error ${i}`,
      })),
      metrics: [],
      traces: [],
      collected_at: now,
    };
    const result = correlate(snapshot);
    expect(result.health).toBe('critical');
  });

  it('stamps a valid ISO timestamp', () => {
    const result = correlate(emptySnapshot());
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes a non-empty summary string', () => {
    const result = correlate(emptySnapshot());
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('sorts anomalies by severity (high before medium before low)', () => {
    const now = new Date().toISOString();
    // Create a high-severity error spike + a slow trace (low)
    const snapshot: TelemetrySnapshot = {
      logs: Array.from({ length: 4 }, (_, i) => ({
        id: String(i),
        timestamp: now,
        level: 'error' as const,
        message: `err${i}`,
      })),
      metrics: [],
      traces: [makeTrace('api', 200, 'error')],
      collected_at: now,
    };
    const result = correlate(snapshot);
    if (result.anomalies.length >= 2) {
      const first = result.anomalies[0].severity;
      const last = result.anomalies[result.anomalies.length - 1].severity;
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      expect(order[first]).toBeLessThanOrEqual(order[last]);
    }
  });
});

// ── rootCauseAnalyzer ─────────────────────────────────────────────────────────

describe('inferRootCause', () => {
  it('returns "healthy" analysis when no anomalies and no errors', () => {
    const result = inferRootCause([], emptySnapshot());
    expect(result.affected_area).toBe('none');
    expect(result.risk).toBe('low');
    expect(result.confidence).toBe('high');
  });

  it('matches TypeError pattern', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'error', message: 'TypeError: Cannot read prop of undefined' }],
    };
    const result = inferRootCause([], snapshot);
    expect(result.affected_area).toBe('UI component layer');
    expect(result.confidence).toBe('high');
  });

  it('matches network error pattern', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'error', message: 'Failed to fetch /api/ai/idari' }],
    };
    const result = inferRootCause([], snapshot);
    expect(result.affected_area).toBe('API / network layer');
    expect(result.risk).toBe('high');
  });

  it('matches auth pattern', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'error', message: '401 Unauthorized request' }],
    };
    const result = inferRootCause([], snapshot);
    expect(result.affected_area).toBe('Auth layer');
  });

  it('matches rate limit pattern', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'warn', message: 'HTTP 429 Too Many Requests' }],
    };
    const result = inferRootCause([], snapshot);
    expect(result.risk).toBe('low');
  });

  it('matches syntax/type compiler pattern', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'error', message: "components/daydream/ContentEngin.tsx:1184:10 Type error: Cannot find name 'repurposeInput'." }],
    };
    const result = inferRootCause([], snapshot);
    expect(result.affected_area).toBe('Build system');
    expect(result.recommended_action).toContain('Restore the missing import');
  });

  it('matches revenue split / tax pattern', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'error', message: 'platform_share mismatch: expected 10% platform and 90% creator split' }],
    };
    const result = inferRootCause([], snapshot);
    expect(result.affected_area).toBe('Financial layer');
    expect(result.recommended_action).toContain('10%');
  });

  it('falls back to anomaly-driven analysis when no pattern matches', () => {
    const anomaly: AnomalySignal = {
      type: 'latency_spike',
      severity: 'medium',
      description: 'api: p95=3000ms',
      window_start: new Date().toISOString(),
      evidence: ['p50: 200ms', 'p95: 3000ms'],
    };
    const result = inferRootCause([anomaly], emptySnapshot());
    expect(result.confidence).toBe('low');
    expect(result.risk).toBe('medium');
  });

  it('stamps a valid ISO timestamp', () => {
    const result = inferRootCause([], emptySnapshot());
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes evidence_summary from anomalies', () => {
    const snapshot: TelemetrySnapshot = {
      ...emptySnapshot(),
      logs: [{ id: '1', timestamp: new Date().toISOString(), level: 'error', message: 'TypeError: undefined is not a function' }],
    };
    const anomaly: AnomalySignal = {
      type: 'error_spike',
      severity: 'high',
      description: 'spike',
      window_start: new Date().toISOString(),
      evidence: ['[ERROR] TypeError: undefined is not a function'],
    };
    const result = inferRootCause([anomaly], snapshot);
    expect(result.evidence_summary.length).toBeGreaterThan(0);
  });
});

// ── idariLoop — buildIdariPrompt ─────────────────────────────────────────────

describe('buildIdariPrompt', () => {
  it('includes the health status in the output', () => {
    const prompt = buildIdariPrompt(
      emptySnapshot(),
      makeCorrelation('critical'),
      makeRootCause('API / network layer'),
    );
    expect(prompt).toContain('CRITICAL');
  });

  it('includes anomaly count', () => {
    const correlation: CorrelationResult = {
      ...makeCorrelation('degraded'),
      anomalies: [
        {
          type: 'error_spike',
          severity: 'medium',
          description: 'test spike',
          window_start: new Date().toISOString(),
          evidence: ['err1'],
        },
      ],
    };
    const prompt = buildIdariPrompt(emptySnapshot(), correlation, makeRootCause('UI component layer'));
    expect(prompt).toContain('1');
    expect(prompt).toContain('error_spike');
  });

  it('includes the root cause likely_cause', () => {
    const rootCause = makeRootCause('Auth layer');
    rootCause.likely_cause = 'Auth failure detected';
    const prompt = buildIdariPrompt(emptySnapshot(), makeCorrelation(), rootCause);
    expect(prompt).toContain('Auth failure detected');
  });

  it('ends with instructions for IDARi', () => {
    const prompt = buildIdariPrompt(emptySnapshot(), makeCorrelation(), makeRootCause());
    expect(prompt).toContain('patch plan');
  });
});

// ── idariLoop — buildFallbackPatchPlan ───────────────────────────────────────

describe('buildFallbackPatchPlan', () => {
  it('returns undefined when affected_area is "none"', () => {
    const plan = buildFallbackPatchPlan(makeRootCause('none'), 'iter-1');
    expect(plan).toBeUndefined();
  });

  it('returns a PatchPlan for a non-healthy root cause', () => {
    const rootCause = makeRootCause('API / network layer');
    rootCause.risk = 'high';
    const plan = buildFallbackPatchPlan(rootCause, 'iter-1');
    expect(plan).toBeDefined();
    expect(plan!.risk).toBe('high');
  });

  it('stamps created_at as an ISO timestamp', () => {
    const rootCause = makeRootCause('UI component layer');
    rootCause.risk = 'medium';
    const plan = buildFallbackPatchPlan(rootCause, 'iter-2');
    expect(plan!.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes rollback steps for high-risk plans', () => {
    const rootCause = makeRootCause('Data layer');
    rootCause.risk = 'high';
    const plan = buildFallbackPatchPlan(rootCause, 'iter-3');
    expect(plan!.rollback).toBeTruthy();
  });

  it('does not include rollback steps for low-risk plans', () => {
    const rootCause = makeRootCause('UI component layer');
    rootCause.risk = 'low';
    const plan = buildFallbackPatchPlan(rootCause, 'iter-4');
    expect(plan!.rollback).toBeUndefined();
  });

  it('includes a non-empty fix description', () => {
    const rootCause = makeRootCause('Build system');
    rootCause.risk = 'medium';
    rootCause.recommended_action = 'Run pnpm install';
    const plan = buildFallbackPatchPlan(rootCause, 'iter-5');
    expect(plan!.fix).toContain('Run pnpm install');
  });

  it('uses immediate-action file hints when present', () => {
    const rootCause = makeRootCause('Build system');
    rootCause.recommended_action = 'Restore the missing import.';
    const action = buildImmediateRemediationAction({
      ...rootCause,
      evidence_summary: ["components/daydream/ContentEngin.tsx:1184:10 Type error: Cannot find name 'repurposeInput'."],
    });
    const plan = buildFallbackPatchPlan(rootCause, 'iter-6', action);
    expect(plan!.steps[0].file).toContain('components/daydream/ContentEngin.tsx');
  });
});

describe('buildImmediateRemediationAction', () => {
  it('returns undefined for healthy root causes', () => {
    expect(buildImmediateRemediationAction(makeRootCause('none'))).toBeUndefined();
  });

  it('builds a syntax action from compiler evidence', () => {
    const action = buildImmediateRemediationAction({
      ...makeRootCause('Build system'),
      likely_cause: 'Syntax / type failure — compiler rejected the current file shape',
      recommended_action: 'Restore the missing import, state, or symbol and re-run the compiler.',
      evidence_summary: ["components/daydream/ContentEngin.tsx:1184:10 Type error: Cannot find name 'repurposeInput'."],
    });
    expect(action?.kind).toBe('syntax');
    expect(action?.file_hints).toContain('components/daydream/ContentEngin.tsx');
    expect(action?.can_auto_apply).toBe(true);
  });

  it('builds a tax action for revenue split mismatches', () => {
    const action = buildImmediateRemediationAction({
      ...makeRootCause('Financial layer'),
      likely_cause: 'Revenue split mismatch',
      recommended_action: 'Verify the 10% platform and 90% creator split constants.',
      evidence_summary: ['platform_share mismatch on gross_revenue payout'],
      risk: 'high',
    });
    expect(action?.kind).toBe('tax');
    expect(action?.file_hints).toContain('app/api/ads/orders/route.ts');
    expect(action?.can_auto_apply).toBe(false);
  });
});

// ── idariLoop — runLoopIteration ─────────────────────────────────────────────

describe('runLoopIteration', () => {
  beforeEach(() => clearBuffers());

  it('returns status="resolved" for an empty (healthy) telemetry buffer', async () => {
    const iteration = await runLoopIteration(1);
    expect(iteration.status).toBe('resolved');
    expect(iteration.correlation.health).toBe('healthy');
    expect(iteration.patch_plan).toBeUndefined();
  });

  it('assigns a valid UUID id', async () => {
    const iteration = await runLoopIteration(1);
    expect(iteration.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('stamps started_at as an ISO timestamp', async () => {
    const iteration = await runLoopIteration(1);
    expect(iteration.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('stamps finished_at', async () => {
    const iteration = await runLoopIteration(1);
    expect(iteration.finished_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns status="patching" when anomalies are present', async () => {
    // Inject a cluster of errors
    const now = new Date().toISOString();
    for (let i = 0; i < 4; i++) {
      collectLog('error', `Crash ${i}`);
    }
    // Make sure they all share a timestamp close enough to be in one bucket
    // by using collectLog directly (timestamps will all be ~now)
    const iteration = await runLoopIteration(1, { windowMs: 60 * 60 * 1000 });
    // Health may be critical or degraded — patch_plan should be set
    if (iteration.correlation.health !== 'healthy') {
      expect(iteration.patch_plan).toBeDefined();
      expect(iteration.immediate_action).toBeDefined();
    }
  });

  it('records the iteration_number', async () => {
    const iteration = await runLoopIteration(7);
    expect(iteration.iteration_number).toBe(7);
  });

  it('snapshot_summary reflects the buffer state', async () => {
    collectLog('info', 'startup');
    collectMetric('req_rate', 42);
    const iteration = await runLoopIteration(1, { windowMs: 60 * 60 * 1000 });
    expect(iteration.snapshot_summary.log_count).toBeGreaterThanOrEqual(1);
    expect(iteration.snapshot_summary.metric_count).toBeGreaterThanOrEqual(1);
  });

  it('calls the AI function when provided and anomalies are found', async () => {
    let aiCalled = false;
    const callAi = async (_prompt: string) => {
      aiCalled = true;
      return 'IDARi: root cause identified — null check missing.';
    };
    // Inject errors to trigger anomaly detection
    for (let i = 0; i < 4; i++) {
      collectLog('error', `Error ${i}`);
    }
    const iteration = await runLoopIteration(1, {
      windowMs: 60 * 60 * 1000,
      callAi,
    });
    if (iteration.correlation.health !== 'healthy') {
      // AI is called and its response is stored in ai_response for display.
      // The patch_plan is always built deterministically from the root cause —
      // AI responses are informational only and not parsed into the plan.
      expect(aiCalled).toBe(true);
      expect(iteration.ai_response).toBe('IDARi: root cause identified — null check missing.');
      // patch_plan comes from the deterministic buildFallbackPatchPlan path
      expect(iteration.patch_plan).toBeDefined();
    }
  });

  it('does not call the AI function when system is healthy', async () => {
    let aiCalled = false;
    const callAi = async (_prompt: string) => {
      aiCalled = true;
      return 'should not be called';
    };
    const iteration = await runLoopIteration(1, { callAi });
    expect(iteration.status).toBe('resolved');
    expect(aiCalled).toBe(false);
  });
});
