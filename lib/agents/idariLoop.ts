// lib/agents/idariLoop.ts
//
// IDARi Observability Remediation Loop
//
// Implements the AI-assisted feedback loop described in PR #254:
//
//   collect → correlate → infer root cause → build IDARi prompt →
//   call /api/ai/idari → parse patch plan → report → iterate
//
// The loop can run client-side (browser) or server-side.
// Pure functions at the bottom are unit-testable without any HTTP calls.

import { v4 as uuidv4 } from 'uuid';
import { getSnapshot, type TelemetrySnapshot } from '@/lib/observability/collector';
import { correlate, type CorrelationResult } from '@/lib/observability/correlator';
import { inferRootCause, type RootCauseAnalysis } from '@/lib/observability/rootCauseAnalyzer';
import { createPatchPlan, type PatchPlan, type PatchRisk } from '@/lib/agents/idari';
import {
  buildImmediateRemediationAction,
  type ImmediateRemediationAction,
} from '@/lib/observability/immediateAction';

// ── Types ─────────────────────────────────────────────────────────────────────

// ── Improvement 61: stopped_by_signal status ─────────────────────────────────
export type LoopStatus =
  | 'idle'
  | 'collecting'
  | 'correlating'
  | 'waiting_for_ai'
  | 'patching'
  | 'verifying'
  | 'resolved'
  | 'failed'
  | 'stopped_by_signal';

export interface LoopSnapshotSummary {
  log_count: number;
  metric_count: number;
  trace_count: number;
  error_count: number;
  window_ms: number;
}

export interface LoopIteration {
  id: string;
  iteration_number: number;
  started_at: string;
  finished_at?: string;
  status: LoopStatus;
  snapshot_summary: LoopSnapshotSummary;
  correlation: CorrelationResult;
  root_cause: RootCauseAnalysis;
  immediate_action?: ImmediateRemediationAction;
  /** Patch plan from the AI (or deterministic fallback). */
  patch_plan?: PatchPlan;
  /** Raw AI response text (available when AI was called). */
  ai_response?: string;
  /** Error message when the iteration failed unexpectedly. */
  error?: string;
  /** Duration of the iteration in milliseconds. */
  duration_ms?: number;
}

export interface RemediationLoopOptions {
  /** Telemetry look-back window in ms. Default: 5 min. */
  windowMs?: number;
  /** Maximum number of iterations. Default: 1 (single-shot). */
  maxIterations?: number;
  /** Called after each completed iteration. */
  onIteration?: (iteration: LoopIteration) => void;
  /** When true, stop after the first healthy snapshot. Default: true. */
  stopOnHealthy?: boolean;
  /**
   * Optional async function that calls the IDARi AI endpoint.
   * Signature matches the callIdari helper used in IDariPanel.
   * When omitted, the loop uses the deterministic fallback patch plan.
   */
  callAi?: (message: string) => Promise<string>;
  // ── Improvement 56: AbortSignal support ────────────────────────────────────
  /** AbortSignal to stop the loop between iterations (prevents memory leaks). */
  signal?: AbortSignal;
  // ── Improvement 57: iteration timeout ─────────────────────────────────────
  /** Maximum time in ms for a single iteration (including AI call). Default: 30 s. */
  iterationTimeoutMs?: number;
  // ── Improvement 58: AI retry ──────────────────────────────────────────────
  /** Number of times to retry a failed AI call before using the fallback. Default: 2. */
  aiRetryAttempts?: number;
  /** Base delay in ms for AI retry backoff. Default: 500 ms. */
  aiRetryBaseDelayMs?: number;
  // ── Improvement 59: snapshot diffing ──────────────────────────────────────
  /** When true, skip AI call if the snapshot fingerprint is unchanged from the
   *  previous iteration. Default: true. */
  skipUnchangedSnapshots?: boolean;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Build a context-enriched IDARi prompt that injects the telemetry summary,
 * anomaly list, and root cause analysis into the message.
 *
 * The prompt follows the IDARi output contract:
 *   cause → impact → smallest safe fix → verification steps.
 */
export function buildIdariPrompt(
  snapshot: TelemetrySnapshot,
  correlation: CorrelationResult,
  rootCause: RootCauseAnalysis,
): string {
  const lines: string[] = [
    '## IDARi Observability Loop — Automated Diagnostic',
    '',
    `**System Health**: ${correlation.health.toUpperCase()}`,
    `**Anomalies Detected**: ${correlation.anomalies.length}`,
    '',
    '### Telemetry Window Summary',
    `- Logs: ${snapshot.logs.length} entries (${snapshot.logs.filter((l) => l.level === 'error').length} errors, ${snapshot.logs.filter((l) => l.level === 'warn').length} warnings)`,
    `- Metrics: ${snapshot.metrics.length} data points`,
    `- Traces: ${snapshot.traces.length} spans (${snapshot.traces.filter((t) => t.status !== 'ok').length} failed)`,
    '',
  ];

  if (correlation.anomalies.length > 0) {
    lines.push('### Detected Anomalies');
    for (const a of correlation.anomalies.slice(0, 5)) {
      lines.push(`- [${a.severity.toUpperCase()}] ${a.type}: ${a.description}`);
      if (a.evidence.length > 0) {
        lines.push(`  Evidence: ${a.evidence[0]}`);
      }
    }
    lines.push('');
  }

  lines.push('### Root Cause Analysis (pattern-matched)');
  lines.push(`- Likely Cause: ${rootCause.likely_cause}`);
  lines.push(`- Confidence: ${rootCause.confidence}`);
  lines.push(`- Affected Area: ${rootCause.affected_area}`);
  lines.push(`- Risk: ${rootCause.risk}`);
  lines.push(`- Recommended Action: ${rootCause.recommended_action}`);

  if (rootCause.evidence_summary.length > 0) {
    lines.push('');
    lines.push('### Key Evidence');
    for (const e of rootCause.evidence_summary.slice(0, 5)) {
      lines.push(`- ${e}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push(
    'Based on the above observability data, produce a structured diagnosis and patch plan. ' +
      'Format: cause → impact → smallest safe fix → verification. ' +
      'If the system is healthy, confirm no action is needed.',
  );

  return lines.join('\n');
}

// ── Fallback patch plan ───────────────────────────────────────────────────────

/**
 * Build a deterministic PatchPlan from the root cause analysis.
 * Used when the AI is unavailable or when the system is degraded but not
 * critical enough to warrant an AI call.
 *
 * Returns undefined when the system is healthy (no patch needed).
 */
export function buildFallbackPatchPlan(
  rootCause: RootCauseAnalysis,
  iterationId: string,
  immediateAction?: ImmediateRemediationAction,
): PatchPlan | undefined {
  if (rootCause.affected_area === 'none') return undefined;

  const risk: PatchRisk = rootCause.risk;
  const needsRollback = risk === 'high' || risk === 'critical';

  return createPatchPlan({
    id: `obs-auto-${iterationId.slice(0, 8)}`,
    title: `Auto-detected: ${rootCause.likely_cause.slice(0, 80)}`,
    cause: rootCause.likely_cause,
    impact: `Affects ${rootCause.affected_area}. Pattern-match confidence: ${rootCause.confidence}.`,
    fix: immediateAction?.summary ?? rootCause.recommended_action,
    verification: immediateAction?.verification.join(' ') ??
      'Re-run the IDARi observability loop after applying the fix — health should return to "healthy".',
    steps: (immediateAction?.file_hints.length
      ? immediateAction.file_hints.slice(0, 3).map((file) => ({
          file,
          diff: `Apply: ${immediateAction.summary}`,
        }))
      : [
          {
            file: 'See IDARi chat for specific file changes',
            diff: `Apply: ${rootCause.recommended_action}`,
          },
        ]),
    risk,
    rollback: needsRollback
      ? 'git revert the change and redeploy; then re-run the observability loop to confirm recovery.'
      : undefined,
  });
}

// ── Single iteration ──────────────────────────────────────────────────────────

// ── Improvement 59: snapshot fingerprint for diffing ─────────────────────────
function _fingerprintSnapshot(snapshot: TelemetrySnapshot): string {
  return `${snapshot.logs.length}:${snapshot.metrics.length}:${snapshot.traces.length}:${
    snapshot.logs.filter((l) => l.level === 'error').length
  }`;
}

// ── Improvement 58: retry AI call with exponential backoff ────────────────────
async function _callAiWithRetry(
  callAi: (msg: string) => Promise<string>,
  prompt: string,
  maxAttempts: number,
  baseDelayMs: number,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await callAi(prompt);
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastErr;
}

// ── Improvement 57: iteration timeout ────────────────────────────────────────
function _withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`IDARi iteration timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Execute one iteration of the IDARi remediation loop.
 *
 * This is the core synchronous path — it reads the current telemetry state,
 * correlates signals, infers the root cause, and builds a patch plan.
 * When a `callAi` function is provided (and anomalies are detected), the AI
 * is called asynchronously for a deeper diagnosis.
 */
export async function runLoopIteration(
  iterationNumber: number,
  options: RemediationLoopOptions = {},
  _prevFingerprint?: string,
): Promise<LoopIteration> {
  const { iteration } = await _runLoopIterationInternal(iterationNumber, options, _prevFingerprint);
  return iteration;
}

// Internal version that also returns the fingerprint for loop diffing.
async function _runLoopIterationInternal(
  iterationNumber: number,
  options: RemediationLoopOptions = {},
  _prevFingerprint?: string,
): Promise<{ iteration: LoopIteration; fingerprint: string }> {
  const {
    windowMs = 5 * 60 * 1000,
    callAi,
    iterationTimeoutMs = 30_000,
    aiRetryAttempts = 2,
    aiRetryBaseDelayMs = 500,
    skipUnchangedSnapshots = true,
  } = options;
  const id = uuidv4();
  const started_at = new Date().toISOString();
  const startMs = Date.now();

  const doIteration = async (): Promise<{ iteration: LoopIteration; fingerprint: string }> => {
    try {
      const snapshot = getSnapshot(windowMs);
      const fingerprint = _fingerprintSnapshot(snapshot);
      const correlation = correlate(snapshot);
      const rootCause = inferRootCause(correlation.anomalies, snapshot);

      const snapshot_summary: LoopSnapshotSummary = {
        log_count: snapshot.logs.length,
        metric_count: snapshot.metrics.length,
        trace_count: snapshot.traces.length,
        error_count: snapshot.logs.filter((l) => l.level === 'error').length,
        window_ms: windowMs,
      };

      // Healthy and no AI needed
      if (correlation.health === 'healthy') {
        const iteration: LoopIteration = {
          id,
          iteration_number: iterationNumber,
          started_at,
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - startMs,
          status: 'resolved',
          snapshot_summary,
          correlation,
          root_cause: rootCause,
          immediate_action: undefined,
        };
        return { iteration, fingerprint };
      }

      let ai_response: string | undefined;
      const immediate_action = buildImmediateRemediationAction(rootCause);
      const patch_plan: PatchPlan | undefined = buildFallbackPatchPlan(rootCause, id, immediate_action);

      // ── Improvement 59: skip AI when snapshot unchanged ───────────────────
      const snapshotChanged = !skipUnchangedSnapshots || fingerprint !== _prevFingerprint;

      if (callAi && patch_plan && snapshotChanged) {
        try {
          const prompt = buildIdariPrompt(snapshot, correlation, rootCause);
          // ── Improvement 58: retry with backoff ────────────────────────────
          ai_response = await _callAiWithRetry(callAi, prompt, aiRetryAttempts + 1, aiRetryBaseDelayMs);
        } catch {
          // AI exhausted retries — the deterministic patch plan is still used
        }
      }

      const status: LoopStatus = patch_plan ? 'patching' : 'failed';

      const iteration: LoopIteration = {
        id,
        iteration_number: iterationNumber,
        started_at,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
        status,
        snapshot_summary,
        correlation,
        root_cause: rootCause,
        immediate_action,
        patch_plan,
        ai_response,
      };
      return { iteration, fingerprint };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const snapshot = getSnapshot(windowMs);
      const fingerprint = _fingerprintSnapshot(snapshot);
      const correlation = correlate(snapshot);
      const rootCause = inferRootCause(correlation.anomalies, snapshot);

      const iteration: LoopIteration = {
        id,
        iteration_number: iterationNumber,
        started_at,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
        status: 'failed',
        snapshot_summary: {
          log_count: snapshot.logs.length,
          metric_count: snapshot.metrics.length,
          trace_count: snapshot.traces.length,
          error_count: snapshot.logs.filter((l) => l.level === 'error').length,
          window_ms: windowMs,
        },
        correlation,
        root_cause: rootCause,
        immediate_action: buildImmediateRemediationAction(rootCause),
        error: message,
      };
      return { iteration, fingerprint };
    }
  };

  return _withTimeout(doIteration(), iterationTimeoutMs);
}

// ── Multi-iteration driver ────────────────────────────────────────────────────

/**
 * Run the IDARi remediation loop for up to `maxIterations` iterations.
 *
 * The loop exits early when:
 * - The system is healthy and `stopOnHealthy` is true (default).
 * - `maxIterations` is reached.
 * - The provided `signal` is aborted.
 *
 * Each completed iteration is passed to `options.onIteration` if provided.
 */
// ── Improvement 56: AbortSignal support ──────────────────────────────────────
export async function runRemediationLoop(
  options: RemediationLoopOptions = {},
): Promise<LoopIteration[]> {
  const {
    maxIterations = 1,
    stopOnHealthy = true,
    onIteration,
    signal,
  } = options;

  const iterations: LoopIteration[] = [];
  let prevFingerprint: string | undefined;

  for (let i = 0; i < maxIterations; i++) {
    // ── Improvement 56: check abort signal ─────────────────────────────────
    if (signal?.aborted) break;

    const { iteration, fingerprint } = await _runLoopIterationInternal(i + 1, options, prevFingerprint);
    prevFingerprint = fingerprint;
    iterations.push(iteration);

    if (onIteration) onIteration(iteration);

    if (stopOnHealthy && iteration.status === 'resolved') break;
    if (iteration.status === 'failed') break;
  }

  return iterations;
}

// ── Improvement 60: getLoopHealthSummary ─────────────────────────────────────

export interface LoopHealthSummary {
  total: number;
  resolved: number;
  failed: number;
  successRate: number;
  avgDurationMs: number;
  lastStatus: LoopStatus | null;
}

/**
 * Compute a health summary from a completed set of loop iterations.
 * Useful for dashboards and log aggregation.
 */
export function getLoopHealthSummary(iterations: readonly LoopIteration[]): LoopHealthSummary {
  if (iterations.length === 0) {
    return { total: 0, resolved: 0, failed: 0, successRate: 0, avgDurationMs: 0, lastStatus: null };
  }
  const resolved = iterations.filter((i) => i.status === 'resolved').length;
  const failed = iterations.filter((i) => i.status === 'failed').length;
  const durations = iterations.filter((i) => i.duration_ms !== undefined).map((i) => i.duration_ms!);
  const avgDurationMs = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  return {
    total: iterations.length,
    resolved,
    failed,
    successRate: resolved / iterations.length,
    avgDurationMs,
    lastStatus: iterations[iterations.length - 1].status,
  };
}
