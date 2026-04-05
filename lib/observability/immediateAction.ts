import type { RootCauseAnalysis } from './rootCauseAnalyzer';

export type ImmediateActionKind =
  | 'syntax'
  | 'dependency'
  | 'tax'
  | 'auth'
  | 'database'
  | 'network'
  | 'performance'
  | 'runtime'
  | 'generic';

export type ImmediateActionUrgency = 'monitor' | 'patch_now' | 'review_now';

export interface ImmediateRemediationAction {
  kind: ImmediateActionKind;
  urgency: ImmediateActionUrgency;
  title: string;
  summary: string;
  file_hints: string[];
  commands: string[];
  verification: string[];
  guardrails: string[];
  can_auto_apply: boolean;
}

const FILE_HINT_PATTERN = /(?:^|[\s(])([A-Za-z0-9_./[\]-]+\.(?:tsx|ts|jsx|js|mjs|cjs|json|yaml|yml|css|sql))(?:[:(]\d+)?/g;

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function extractFileHints(rootCause: RootCauseAnalysis): string[] {
  const combined = [
    rootCause.likely_cause,
    rootCause.recommended_action,
    ...rootCause.evidence_summary,
  ].join(' ');

  const matches = [...combined.matchAll(FILE_HINT_PATTERN)].map((match) => match[1]?.replace(/^[(/]+/, '') ?? '');
  return unique(matches);
}

function includesAny(source: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(source));
}

export function buildImmediateRemediationAction(
  rootCause: RootCauseAnalysis,
): ImmediateRemediationAction | undefined {
  if (rootCause.affected_area === 'none') return undefined;

  const evidenceText = [
    rootCause.likely_cause,
    rootCause.recommended_action,
    ...rootCause.evidence_summary,
  ].join(' ');

  const fileHints = extractFileHints(rootCause);

  if (includesAny(evidenceText, [
    /syntaxerror|unexpected token|parsing error|unterminated/i,
    /cannot find name|referenceerror/i,
    /expected ['"`)}\]]/i,
  ])) {
    return {
      kind: 'syntax',
      urgency: 'patch_now',
      title: 'Patch the broken syntax/type surface immediately',
      summary: 'Repair the referenced file in place by restoring the missing symbol, import, state, or syntax token without deleting behavior.',
      file_hints: unique([...fileHints]),
      commands: ['pnpm run typecheck', 'pnpm run build'],
      verification: [
        'Confirm the original syntax/type error line no longer appears.',
        'Re-run the build and typecheck to ensure the compiler is clean for the touched path.',
      ],
      guardrails: [
        'Do not delete features to silence the compiler.',
        'Keep the existing runtime behavior intact while restoring valid syntax/types.',
      ],
      can_auto_apply: true,
    };
  }

  if (includesAny(evidenceText, [
    /module not found|cannot find module|dependency|package|lockfile|pnpm install|npm install/i,
    /build \/ bundler error/i,
  ])) {
    return {
      kind: 'dependency',
      urgency: 'patch_now',
      title: 'Repair the dependency or import graph',
      summary: 'Fix the broken dependency path by restoring the missing package, import path, or lockfile alignment without changing product behavior.',
      file_hints: unique([...fileHints, 'package.json', 'pnpm-lock.yaml']),
      commands: ['pnpm install', 'pnpm run build', 'pnpm run test'],
      verification: [
        'Confirm module resolution succeeds for the previously failing import.',
        'Re-run build and tests after the dependency graph is repaired.',
      ],
      guardrails: [
        'Prefer existing dependencies before adding new ones.',
        'Do not remove features just to avoid loading a dependency.',
      ],
      can_auto_apply: true,
    };
  }

  if (includesAny(evidenceText, [
    /tax|platform_share|creator_share|platform payout|creator payout|gross_revenue|grossamount/i,
    /10%\s*platform|0\.10|90%\s*creator/i,
  ])) {
    return {
      kind: 'tax',
      urgency: 'review_now',
      title: 'Correct the revenue-split math at the server source',
      summary: 'Verify the 10% platform and 90% creator split on the server, then patch the shared calculation/constants so payout math is corrected at the source.',
      file_hints: unique([
        ...fileHints,
        'app/api/ads/orders/route.ts',
        'lib/platform/index.ts',
      ]),
      commands: ['pnpm run test', 'pnpm run build'],
      verification: [
        'Confirm platform_share stays at 0.10 and creator_share stays at 0.90.',
        'Verify creator_payout + platform_payout equals gross_revenue after rounding.',
      ],
      guardrails: [
        'Never trust client-supplied payout values.',
        'Do not change historical data blindly; patch the server-side calculation path first.',
      ],
      can_auto_apply: false,
    };
  }

  if (includesAny(evidenceText, [/auth|401|403|forbidden|unauthorized|jwt|session expired/i])) {
    return {
      kind: 'auth',
      urgency: rootCause.risk === 'high' || rootCause.risk === 'critical' ? 'review_now' : 'patch_now',
      title: 'Repair the auth/session failure',
      summary: 'Fix the session, permission, or RLS path causing the authorization failure while preserving the existing security boundary.',
      file_hints: fileHints,
      commands: ['pnpm run test', 'pnpm run build'],
      verification: [
        'Confirm authenticated access succeeds for the intended actor.',
        'Confirm unauthorized access is still rejected.',
      ],
      guardrails: [
        'Do not bypass auth or weaken RLS to make the error disappear.',
      ],
      can_auto_apply: rootCause.risk === 'low' || rootCause.risk === 'medium',
    };
  }

  if (includesAny(evidenceText, [/database|supabase|postgres|relation|constraint|foreign key|unique violation/i])) {
    return {
      kind: 'database',
      urgency: 'review_now',
      title: 'Fix the schema/query mismatch without dropping data',
      summary: 'Repair the failing query, schema assumption, or RLS mismatch in place and keep all existing records and product surfaces intact.',
      file_hints: fileHints,
      commands: ['pnpm run test', 'pnpm run build'],
      verification: [
        'Confirm the failing query executes successfully.',
        'Confirm the data contract still matches the consuming code.',
      ],
      guardrails: [
        'Do not delete data or tables to clear the error.',
        'Prefer narrow query/type fixes before structural schema changes.',
      ],
      can_auto_apply: false,
    };
  }

  if (includesAny(evidenceText, [/network error|failed to fetch|timeout|timed out|service unavailable/i])) {
    return {
      kind: 'network',
      urgency: rootCause.risk === 'high' ? 'review_now' : 'patch_now',
      title: 'Stabilize the failing network path',
      summary: 'Repair the failing API path, retry behavior, or environment configuration without hiding the outage behind silent failure.',
      file_hints: fileHints,
      commands: ['pnpm run test', 'pnpm run build'],
      verification: [
        'Confirm the request succeeds or fails with an intentional user-facing state.',
      ],
      guardrails: [
        'Do not replace the failure with fake success data.',
      ],
      can_auto_apply: rootCause.risk === 'low' || rootCause.risk === 'medium',
    };
  }

  if (includesAny(evidenceText, [/memory|heap|out of memory|latency|performance|re-render/i])) {
    return {
      kind: 'performance',
      urgency: 'review_now',
      title: 'Reduce the runaway performance path',
      summary: 'Patch the hot path that is over-allocating, re-rendering, or timing out without removing user-visible capability.',
      file_hints: fileHints,
      commands: ['pnpm run test', 'pnpm run build'],
      verification: [
        'Confirm the latency or memory spike is reduced on the affected path.',
      ],
      guardrails: [
        'Do not disable the feature outright to hide the performance issue.',
      ],
      can_auto_apply: false,
    };
  }

  if (includesAny(evidenceText, [/typeerror|cannot read|undefined|null dereference|is not a function/i])) {
    return {
      kind: 'runtime',
      urgency: 'patch_now',
      title: 'Patch the runtime guard in place',
      summary: 'Add the smallest safe null/shape guard and restore the missing state or prop path without deleting the surrounding feature.',
      file_hints: fileHints,
      commands: ['pnpm run test', 'pnpm run build'],
      verification: [
        'Confirm the original runtime error is gone.',
        'Confirm the affected interaction still behaves correctly.',
      ],
      guardrails: [
        'Do not remove the affected UI flow to avoid the exception.',
      ],
      can_auto_apply: true,
    };
  }

  return {
    kind: 'generic',
    urgency: rootCause.risk === 'high' || rootCause.risk === 'critical' ? 'review_now' : 'patch_now',
    title: 'Apply the smallest safe fix immediately',
    summary: 'Patch the failing code path directly, preserve behavior, and verify the original error no longer reproduces.',
    file_hints: fileHints,
    commands: ['pnpm run test', 'pnpm run build'],
    verification: [
      'Reproduce the original issue before and after the patch.',
      'Confirm the error is resolved without deleting behavior.',
    ],
    guardrails: [
      'Prefer narrow fixes over broad rewrites.',
      'Do not delete features or data to make the error disappear.',
    ],
    can_auto_apply: rootCause.risk === 'low' || rootCause.risk === 'medium',
  };
}
