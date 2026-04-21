/**
 * lib/enginpipe/pulse/index.ts
 *
 * Component 7 — Autonomous Iteration Cycle ("The Pulse")
 *
 * The Pulse is the heartbeat of every DREAMengin Engin.  It drives a
 * 7-stage autonomous loop that continuously refines Engin output:
 *
 *   1. ANALYZE    — Read telemetry signals; compute quality score
 *   2. RESEARCH   — Query the Brain for relevant patterns and principles
 *   3. GENERATE   — Produce a candidate output via the provided generator
 *   4. VALIDATE   — Check the output against Brain principles
 *   5. PACKAGE    — Serialise the validated output into a deployable form
 *   6. DEPLOY     — Emit the package downstream (bridge / queue / callback)
 *   7. LOG        — Record the cycle to the Brain session and telemetry
 *
 * The Pulse is intentionally framework-agnostic.  All external I/O
 * (AI calls, Supabase writes, bridge emissions) is injected via adapters.
 *
 * Usage:
 *   const pulse = createPulse({ brain, enginId: 'code', ... });
 *   const result = await pulse.run(signals);
 *
 * Server-safe: pure TypeScript, no React, no DOM.
 *
 * Spec: docs/enginpipe/README.md §7
 */

import {
  type Brain,
  type BrainSession,
  type Principle,
} from '@/lib/enginpipe/brain';
import { type TelemetrySignal } from '@/lib/enginpipe/orchestration';
import { snapshotManager } from '@/lib/enginpipe/snapshot';

// ─── Pulse stage ──────────────────────────────────────────────────────────────

export type PulseStage =
  | 'analyze'
  | 'research'
  | 'generate'
  | 'validate'
  | 'package'
  | 'deploy'
  | 'log';

export const PULSE_STAGES: readonly PulseStage[] = [
  'analyze', 'research', 'generate', 'validate', 'package', 'deploy', 'log',
];

// ─── Stage contexts ───────────────────────────────────────────────────────────

export interface AnalyzeContext {
  signals: TelemetrySignal[];
  /** Aggregate quality score 0–1 derived from signals. */
  qualityScore: number;
  /** Suggested focus area based on the worst-scoring signals. */
  focusArea?: string;
}

export interface ResearchContext extends AnalyzeContext {
  matchedPrinciples: Principle[];
  topPredictions: ReturnType<Brain['topPredictions']>;
}

export interface GenerateContext extends ResearchContext {
  /** Candidate output produced by the generator adapter. */
  candidate: Record<string, unknown>;
}

export interface ValidateContext extends GenerateContext {
  /**
   * Validation result: `true` if all matching principles passed,
   * otherwise the violated principle IDs.
   */
  valid: boolean;
  violations: string[];
}

export interface PackageContext extends ValidateContext {
  /** Binary snapshot of the validated candidate. */
  snapshot: Uint8Array;
}

export interface DeployContext extends PackageContext {
  /** True if the deployment adapter accepted the package. */
  deployed: boolean;
  deployError?: string;
}

export type LogContext = DeployContext;

// ─── Cycle result ─────────────────────────────────────────────────────────────

export type PulseCycleStatus =
  | 'success'        // completed all 7 stages, deployed
  | 'aborted'        // generator returned null (no candidate)
  | 'invalid'        // validate stage rejected the candidate
  | 'deploy_failed'  // deploy adapter threw / returned false
  | 'error';         // unexpected exception

export interface PulseCycleResult {
  readonly cycleId: string;
  readonly enginId: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly status: PulseCycleStatus;
  /** Final completed stage (useful for partial cycle debugging). */
  readonly lastStage: PulseStage;
  /** The deployed snapshot, when status === 'success'. */
  readonly snapshot?: Uint8Array;
  readonly error?: string;
}

// ─── Pulse adapters ───────────────────────────────────────────────────────────

export interface PulseAdapters {
  /**
   * Generator adapter: produce a candidate given the research context.
   * Return `null` to abort the cycle (status → 'aborted').
   */
  generate(ctx: ResearchContext): Promise<Record<string, unknown> | null>;

  /**
   * Deploy adapter: receive the validated, packaged snapshot.
   * Return `true` on success, `false` / throw on failure.
   */
  deploy(pkg: PackageContext): Promise<boolean>;

  /**
   * Log adapter (optional): called after every cycle with the full result.
   * Useful for writing to Supabase or emitting to a telemetry table.
   */
  log?: (result: PulseCycleResult) => void | Promise<void>;
}

// ─── Pulse options ────────────────────────────────────────────────────────────

export interface PulseOptions {
  brain:    Brain;
  enginId:  string;
  adapters: PulseAdapters;
  /**
   * Minimum quality score required to proceed past ANALYZE.
   * Cycles with `qualityScore < minQuality` are aborted early.
   * @default 0 (never abort early)
   */
  minQuality?: number;
}

// ─── Pulse instance ───────────────────────────────────────────────────────────

export interface Pulse {
  /**
   * Run one full Analyze→…→Log cycle.
   * Always resolves (never rejects) — errors are captured in the result.
   */
  run(signals: TelemetrySignal[]): Promise<PulseCycleResult>;

  /** Return the history of completed cycles (most-recent first). */
  getHistory(limit?: number): readonly PulseCycleResult[];
}

// ─── Quality scoring ──────────────────────────────────────────────────────────

function computeQualityScore(signals: TelemetrySignal[]): {
  score: number;
  focusArea?: string;
} {
  if (signals.length === 0) return { score: 1 };

  // Base score: proportion of signals with non-error event types.
  const errorSignals = signals.filter((s) => s.eventType.includes('error'));
  const base = 1 - errorSignals.length / signals.length;

  // Find the Engin with the most error signals as the focus area.
  const focusArea = errorSignals.length > 0
    ? errorSignals.reduce((prev, curr) => curr.count > prev.count ? curr : prev).enginId
    : undefined;

  return { score: Math.max(0, Math.min(1, base)), focusArea };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateCandidate(
  candidate: Record<string, unknown>,
  principles: Principle[],
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const p of principles) {
    // Structural check: if the principle is about privacy, ensure the candidate
    // does not contain obviously public-by-default fields.
    if (p.category === 'privacy') {
      const hasPublicFlag =
        'public' in candidate && candidate.public === true;
      if (hasPublicFlag) violations.push(p.id);
    }

    // Behavior check: stub/no-op detection.
    if (p.category === 'behavior') {
      const hasStub =
        typeof candidate.action === 'string' &&
        (candidate.action === '' || candidate.action === '#');
      if (hasStub) violations.push(p.id);
    }

    // Naming check: detect OS-layer-rejected terminology.
    if (p.category === 'naming') {
      const forbidden = ['widget', 'page', 'dashboard', 'card', 'tab'];
      const label     = String(candidate.label ?? candidate.name ?? '').toLowerCase();
      if (forbidden.some((w) => label.includes(w))) violations.push(p.id);
    }
  }

  return { valid: violations.length === 0, violations };
}

// ─── createPulse factory ──────────────────────────────────────────────────────

let _cycleCounter = 0;
function newCycleId(enginId: string): string {
  return `pulse-${enginId}-${Date.now().toString(36)}-${(_cycleCounter++).toString(36)}`;
}

export function createPulse(opts: PulseOptions): Pulse {
  const { brain, enginId, adapters } = opts;
  const minQuality = opts.minQuality ?? 0;
  const history: PulseCycleResult[] = [];

  async function runCycle(signals: TelemetrySignal[]): Promise<PulseCycleResult> {
    const cycleId   = newCycleId(enginId);
    const startedAt = Date.now();
    let   lastStage: PulseStage = 'analyze';
    let   session: BrainSession | undefined;

    try {
      // ── 1. ANALYZE ──────────────────────────────────────────────────────
      const { score: qualityScore, focusArea } = computeQualityScore(signals);
      const analyzeCtx: AnalyzeContext = { signals, qualityScore, focusArea };

      if (qualityScore < minQuality) {
        return finish('aborted', lastStage, undefined, undefined);
      }

      // ── 2. RESEARCH ─────────────────────────────────────────────────────
      lastStage = 'research';
      session   = brain.startSession(enginId);
      brain.recordEvent(session.sessionId, { type: 'observe', payload: { qualityScore, signalCount: signals.length } });

      const matchedPrinciples = [
        ...brain.getPrinciplesByCategory('architecture'),
        ...brain.getPrinciplesByCategory('behavior'),
        ...brain.getPrinciplesByCategory('naming'),
        ...brain.getPrinciplesByCategory('privacy'),
      ];
      const topPredictions = brain.topPredictions(3);

      const researchCtx: ResearchContext = { ...analyzeCtx, matchedPrinciples, topPredictions };

      // ── 3. GENERATE ─────────────────────────────────────────────────────
      lastStage = 'generate';
      brain.recordEvent(session.sessionId, { type: 'generate', payload: { predictionsConsidered: topPredictions.length } });

      const candidate = await adapters.generate(researchCtx);
      if (candidate === null) {
        brain.endSession(session.sessionId);
        return finish('aborted', lastStage, undefined, undefined);
      }

      const generateCtx: GenerateContext = { ...researchCtx, candidate };

      // ── 4. VALIDATE ─────────────────────────────────────────────────────
      lastStage = 'validate';
      const { valid, violations } = validateCandidate(candidate, matchedPrinciples);
      const validateCtx: ValidateContext = { ...generateCtx, valid, violations };

      if (!valid) {
        brain.recordEvent(session.sessionId, {
          type:    'error',
          payload: { violations, stage: 'validate' },
        });
        brain.endSession(session.sessionId);
        return finish('invalid', lastStage, undefined, undefined);
      }

      // ── 5. PACKAGE ──────────────────────────────────────────────────────
      lastStage = 'package';
      const snapshot = snapshotManager.writeSnapshot(candidate, enginId);
      const packageCtx: PackageContext = { ...validateCtx, snapshot };

      // ── 6. DEPLOY ───────────────────────────────────────────────────────
      lastStage = 'deploy';
      let deployed   = false;
      let deployError: string | undefined;

      try {
        deployed = await adapters.deploy(packageCtx);
      } catch (err) {
        deployError = err instanceof Error ? err.message : String(err);
      }

      const deployCtx: DeployContext = { ...packageCtx, deployed, deployError };

      if (!deployed) {
        brain.recordEvent(session.sessionId, {
          type:    'error',
          payload: { deployError, stage: 'deploy' },
        });
        brain.endSession(session.sessionId);
        return finish('deploy_failed', lastStage, undefined, undefined);
      }

      // ── 7. LOG ──────────────────────────────────────────────────────────
      lastStage = 'log';
      brain.recordEvent(session.sessionId, {
        type:    'deploy',
        payload: { snapshotBytes: snapshot.byteLength, violations: [] },
      });
      brain.endSession(session.sessionId);

      // Reinforce patterns that contributed to a successful cycle.
      for (const pat of brain.getPatternsByKind('workflow').slice(0, 3)) {
        brain.usePattern(pat.id);
      }

      return finish('success', lastStage, snapshot, deployCtx);
    } catch (err) {
      session && brain.endSession(session.sessionId);
      return finish('error', lastStage, undefined, undefined, String(err));
    }

    function finish(
      status: PulseCycleStatus,
      stage: PulseStage,
      snapshot: Uint8Array | undefined,
      _ctx: unknown,
      error?: string,
    ): PulseCycleResult {
      const result: PulseCycleResult = {
        cycleId,
        enginId,
        startedAt,
        endedAt: Date.now(),
        status,
        lastStage: stage,
        snapshot,
        error,
      };
      history.unshift(result);
      if (history.length > 100) history.length = 100;
      adapters.log?.(result);
      return result;
    }
  }

  return {
    run:        runCycle,
    getHistory: (limit = 50) => history.slice(0, limit),
  };
}
