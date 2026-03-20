// lib/observability/rootCauseAnalyzer.ts
//
// Pattern-matched root cause inference for the IDARi observability loop.
//
// Strategy: match the combined evidence text (from anomaly signals + error log
// messages) against a priority-ordered list of known error patterns. The first
// matching pattern wins and provides a ready-made recommended_action. When no
// pattern matches, the top anomaly signal drives a generic fallback analysis.

import type { AnomalySignal } from './correlator';
import type { TelemetrySnapshot } from './collector';
import type { PatchRisk } from '@/lib/agents/idari';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RootCauseConfidence = 'high' | 'medium' | 'low';

export interface RootCauseAnalysis {
  /** ISO timestamp when the analysis was computed. */
  timestamp: string;
  /** One-sentence cause description injected into the IDARi prompt. */
  likely_cause: string;
  confidence: RootCauseConfidence;
  /** Architectural layer affected — used to pick the right fix strategy. */
  affected_area: string;
  risk: PatchRisk;
  /** The recommended smallest safe fix. */
  recommended_action: string;
  /** Up to 5 evidence strings surfaced from the telemetry. */
  evidence_summary: string[];
}

// ── Known error patterns ──────────────────────────────────────────────────────

interface KnownPattern {
  pattern: RegExp;
  cause: string;
  area: string;
  action: string;
  risk: PatchRisk;
}

const KNOWN_PATTERNS: KnownPattern[] = [
  {
    pattern: /undefined is not a function|typeerror|cannot read prop|cannot set prop|is not a function/i,
    cause: 'Null/undefined dereference — component received an unexpected prop shape or missing data',
    area: 'UI component layer',
    action:
      'Add null guards and TypeScript strict-null checks in the affected component; ' +
      'add optional chaining (?.) at the dereference site.',
    risk: 'medium',
  },
  {
    pattern: /network error|failed to fetch|econnrefused|503|service unavailable/i,
    cause: 'Network / API connectivity failure — backend is unreachable or timing out',
    area: 'API / network layer',
    action:
      'Check API route health and environment variables; add retry logic with exponential backoff; ' +
      'verify Supabase and Groq credentials are set.',
    risk: 'high',
  },
  {
    pattern: /rate.?limit|429|too many requests/i,
    cause: 'Rate limit reached — requests are being throttled by a downstream API',
    area: 'API rate limiting',
    action:
      'Implement request queuing or exponential backoff in the calling client; ' +
      'surface a user-facing "slow down" message.',
    risk: 'low',
  },
  {
    pattern: /auth|401|403|unauthorized|forbidden|session expired|jwt/i,
    cause: 'Authentication / authorization failure — session may have expired or RLS policy is too strict',
    area: 'Auth layer',
    action:
      'Verify session validity and token expiry; ' +
      'check RLS policy on the affected table; ' +
      'ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is correctly set.',
    risk: 'high',
  },
  {
    pattern: /supabase|database|postgres|relation|constraint|unique violation|foreign key/i,
    cause: 'Database error — query failure, constraint violation, or schema mismatch',
    area: 'Data layer',
    action:
      'Check Supabase logs for the failing query; ' +
      'verify schema migrations have been applied; ' +
      'review RLS policies with IDARI_CONTRACT.md §4.',
    risk: 'high',
  },
  {
    pattern: /timeout|timed out|etimedout|deadline exceeded/i,
    cause: 'Operation timeout — server or client exceeded the time budget',
    area: 'Performance',
    action:
      'Profile the slow code path; add caching at the appropriate layer; ' +
      'increase the timeout threshold only if the operation is intrinsically slow.',
    risk: 'medium',
  },
  {
    pattern: /chunk|webpack|module not found|cannot find module|import error/i,
    cause: 'Build / bundler error — missing module or incorrect import path',
    area: 'Build system',
    action: 'Run `pnpm install` and verify all import paths use the @/ alias.',
    risk: 'medium',
  },
  {
    pattern: /memory|heap|out of memory|gc pause|allocation failed/i,
    cause: 'Memory pressure — likely a leak or unbounded data structure growth',
    area: 'Runtime memory',
    action:
      'Profile with DevTools Memory panel; check for accumulating React state, ' +
      'uncleaned event listeners, or ring buffers without a size cap.',
    risk: 'high',
  },
  {
    pattern: /render|re-render|infinite loop|too many re-renders/i,
    cause: 'Excessive re-renders — missing dependency array or circular state update',
    area: 'UI rendering',
    action:
      'Add or fix the dependency array in the relevant useEffect; ' +
      'use useMemo / useCallback to stabilise derived values.',
    risk: 'medium',
  },
  {
    pattern: /cors|cross.?origin|blocked by cors/i,
    cause: 'CORS policy rejection — browser blocked a cross-origin request',
    area: 'API / security',
    action:
      'Add the correct Access-Control-Allow-Origin header in the API route; ' +
      'route the call through a Next.js API proxy to avoid browser CORS checks.',
    risk: 'medium',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

/**
 * Infer the most likely root cause from anomaly signals and raw log messages.
 *
 * Pattern matching runs against the concatenated evidence string; the first
 * matching pattern is returned with 'high' confidence. If no pattern matches,
 * the top anomaly drives a generic 'low'-confidence fallback.
 */
export function inferRootCause(
  anomalies: AnomalySignal[],
  snapshot: TelemetrySnapshot,
): RootCauseAnalysis {
  const errorMessages = snapshot.logs
    .filter((l) => l.level === 'error' || l.level === 'warn')
    .map((l) => l.message);

  const allEvidence: string[] = [
    ...anomalies.flatMap((a) => a.evidence),
    ...errorMessages,
  ];

  const evidenceText = allEvidence.join(' ');

  // Pattern matching
  for (const p of KNOWN_PATTERNS) {
    if (p.pattern.test(evidenceText)) {
      return {
        timestamp: new Date().toISOString(),
        likely_cause: p.cause,
        confidence: 'high',
        affected_area: p.area,
        risk: p.risk,
        recommended_action: p.action,
        evidence_summary: allEvidence.slice(0, 5),
      };
    }
  }

  // No pattern — healthy system
  if (anomalies.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      likely_cause: 'No anomalies detected — system appears healthy',
      confidence: 'high',
      affected_area: 'none',
      risk: 'low',
      recommended_action: 'No corrective action required.',
      evidence_summary: [],
    };
  }

  // No pattern but anomalies present — generic fallback
  const top = anomalies[0];
  const fallbackRisk: PatchRisk =
    top.severity === 'high' ? 'high' : top.severity === 'medium' ? 'medium' : 'low';

  return {
    timestamp: new Date().toISOString(),
    likely_cause: `Unclassified anomaly: ${top.description}`,
    confidence: 'low',
    affected_area: top.type,
    risk: fallbackRisk,
    recommended_action:
      'Inspect telemetry manually and correlate with recent deployments or code changes.',
    evidence_summary: top.evidence.slice(0, 5),
  };
}
