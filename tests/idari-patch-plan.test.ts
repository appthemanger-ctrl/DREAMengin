/**
 * tests/idari-patch-plan.test.ts
 *
 * Unit tests for the pure helper functions exported from lib/agents/idari.ts:
 *   - createPatchPlan (req #11, #12, #13)
 *   - createKnownIssue (req #23)
 *   - updateKnownIssueStatus (req #23)
 *   - evaluateSpecRequirements (spec-check before any build/upgrade cycle)
 *   - createVercelBuildResult (Vercel-compatible build verification)
 */

import { describe, it, expect } from 'vitest';
import {
  createPatchPlan,
  createKnownIssue,
  updateKnownIssueStatus,
  evaluateSpecRequirements,
  createVercelBuildResult,
  VERCEL_2026_RUNTIME,
  assessGenerationLawScope,
  formatGenerationLawLoadCheck,
  type PatchPlan,
  type KnownIssue,
  type SpecRequirement,
} from '@/lib/agents/idari';

// ── createPatchPlan ───────────────────────────────────────────────────────────

describe('createPatchPlan', () => {
  const base: Omit<PatchPlan, 'created_at'> = {
    id: 'patch-001',
    title: 'Fix unbounded re-render in HomeFeed',
    cause: 'Missing dependency array in useEffect',
    impact: 'Re-renders on every keystroke; battery drain + jank',
    fix: 'Add [posts] to useEffect dependency array',
    verification: 'React DevTools Profiler shows render count stabilises',
    steps: [{ file: 'components/HomeFeed.tsx', diff: '- useEffect(() => {\n+ useEffect(() => {, [posts])' }],
    risk: 'low',
  };

  it('stamps created_at as an ISO timestamp', () => {
    const plan = createPatchPlan(base);
    expect(plan.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves all input fields', () => {
    const plan = createPatchPlan(base);
    expect(plan.id).toBe('patch-001');
    expect(plan.cause).toBe(base.cause);
    expect(plan.impact).toBe(base.impact);
    expect(plan.fix).toBe(base.fix);
    expect(plan.verification).toBe(base.verification);
    expect(plan.steps).toHaveLength(1);
  });

  it('allows low/medium risk without rollback', () => {
    expect(() => createPatchPlan({ ...base, risk: 'low' })).not.toThrow();
    expect(() => createPatchPlan({ ...base, risk: 'medium' })).not.toThrow();
  });

  it('throws when high risk and no rollback is provided (req #13)', () => {
    expect(() =>
      createPatchPlan({ ...base, risk: 'high', rollback: undefined })
    ).toThrow('missing rollback steps');
  });

  it('throws when critical risk and no rollback is provided (req #13)', () => {
    expect(() =>
      createPatchPlan({ ...base, risk: 'critical', rollback: undefined })
    ).toThrow('missing rollback steps');
  });

  it('accepts high risk when rollback is provided (req #13)', () => {
    const plan = createPatchPlan({
      ...base,
      risk: 'high',
      rollback: 'git revert <sha>',
    });
    expect(plan.rollback).toBe('git revert <sha>');
  });
});

// ── createKnownIssue ─────────────────────────────────────────────────────────

describe('createKnownIssue', () => {
  const base: Omit<KnownIssue, 'status' | 'created_at' | 'updated_at'> = {
    id: 'issue-001',
    title: 'isAdminLocked() called without await',
    description: 'ai-chat route calls isAdminLocked() synchronously; lockout may not be applied',
    risk: 'high',
  };

  it('sets status to "open" by default', () => {
    const issue = createKnownIssue(base);
    expect(issue.status).toBe('open');
  });

  it('stamps created_at and updated_at as ISO timestamps', () => {
    const issue = createKnownIssue(base);
    expect(issue.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(issue.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('sets created_at and updated_at to the same value on creation', () => {
    const issue = createKnownIssue(base);
    expect(issue.created_at).toBe(issue.updated_at);
  });

  it('preserves input fields', () => {
    const issue = createKnownIssue(base);
    expect(issue.id).toBe('issue-001');
    expect(issue.risk).toBe('high');
  });
});

// ── updateKnownIssueStatus ───────────────────────────────────────────────────

describe('updateKnownIssueStatus', () => {
  const now = new Date().toISOString();
  const open: KnownIssue = {
    id: 'issue-001',
    title: 'Test issue',
    description: 'desc',
    risk: 'medium',
    status: 'open',
    created_at: now,
    updated_at: now,
  };

  it('updates status correctly', () => {
    const updated = updateKnownIssueStatus(open, 'resolved');
    expect(updated.status).toBe('resolved');
  });

  it('refreshes updated_at', () => {
    const updated = updateKnownIssueStatus(open, 'in_progress');
    expect(updated.updated_at).not.toBe(open.updated_at);
  });

  it('preserves created_at', () => {
    const updated = updateKnownIssueStatus(open, 'wont_fix');
    expect(updated.created_at).toBe(open.created_at);
  });

  it('attaches patch_plan_id when provided', () => {
    const updated = updateKnownIssueStatus(open, 'in_progress', 'patch-001');
    expect(updated.patch_plan_id).toBe('patch-001');
  });

  it('preserves existing patch_plan_id when none provided', () => {
    const withPlan = { ...open, patch_plan_id: 'existing-plan' };
    const updated = updateKnownIssueStatus(withPlan, 'resolved');
    expect(updated.patch_plan_id).toBe('existing-plan');
  });

  it('does not mutate the original issue', () => {
    updateKnownIssueStatus(open, 'resolved');
    expect(open.status).toBe('open');
  });
});

// ── evaluateSpecRequirements ─────────────────────────────────────────────────

describe('evaluateSpecRequirements', () => {
  const makeReq = (
    id: string,
    status: SpecRequirement['status'],
  ): SpecRequirement => ({
    id,
    area: 'test',
    description: `Requirement ${id}`,
    status,
  });

  it('returns "pass" when all requirements are met', () => {
    const result = evaluateSpecRequirements('test-spec', [
      makeReq('r1', 'met'),
      makeReq('r2', 'met'),
    ]);
    expect(result.overall).toBe('pass');
    expect(result.unmet_count).toBe(0);
    expect(result.partial_count).toBe(0);
  });

  it('returns "warn" when some requirements are partial but none are missing', () => {
    const result = evaluateSpecRequirements('test-spec', [
      makeReq('r1', 'met'),
      makeReq('r2', 'partial'),
    ]);
    expect(result.overall).toBe('warn');
    expect(result.unmet_count).toBe(0);
    expect(result.partial_count).toBe(1);
  });

  it('returns "fail" when any requirement is missing', () => {
    const result = evaluateSpecRequirements('test-spec', [
      makeReq('r1', 'met'),
      makeReq('r2', 'partial'),
      makeReq('r3', 'missing'),
    ]);
    expect(result.overall).toBe('fail');
    expect(result.unmet_count).toBe(1);
  });

  it('counts multiple missing and partial requirements correctly', () => {
    const result = evaluateSpecRequirements('dreamengin_phase6', [
      makeReq('r1', 'missing'),
      makeReq('r2', 'missing'),
      makeReq('r3', 'partial'),
      makeReq('r4', 'met'),
    ]);
    expect(result.unmet_count).toBe(2);
    expect(result.partial_count).toBe(1);
  });

  it('stamps timestamp as an ISO string', () => {
    const result = evaluateSpecRequirements('test-spec', [makeReq('r1', 'met')]);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('passes through spec_version unchanged', () => {
    const result = evaluateSpecRequirements('dreamengin_phase6', [makeReq('r1', 'met')]);
    expect(result.spec_version).toBe('dreamengin_phase6');
  });

  it('preserves all requirement objects in the result', () => {
    const reqs: SpecRequirement[] = [makeReq('r1', 'met'), makeReq('r2', 'partial')];
    const result = evaluateSpecRequirements('test-spec', reqs);
    expect(result.requirements).toHaveLength(2);
    expect(result.requirements[0].id).toBe('r1');
    expect(result.requirements[1].id).toBe('r2');
  });

  it('handles an empty requirements array (pass with zero counts)', () => {
    const result = evaluateSpecRequirements('test-spec', []);
    expect(result.overall).toBe('pass');
    expect(result.unmet_count).toBe(0);
    expect(result.partial_count).toBe(0);
  });
});

// ── createVercelBuildResult ───────────────────────────────────────────────────

describe('createVercelBuildResult', () => {
  it('accepts a passing build meeting the 2026 runtime targets', () => {
    const result = createVercelBuildResult({
      node_version: VERCEL_2026_RUNTIME.node,
      pnpm_version: VERCEL_2026_RUNTIME.pnpm,
      nextjs_version: VERCEL_2026_RUNTIME.nextjs_minimum,
      build_passed: true,
      route_count: 42,
    });
    expect(result.build_passed).toBe(true);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.route_count).toBe(42);
  });

  it('records a failed build without throwing', () => {
    const result = createVercelBuildResult({
      node_version: '24',
      pnpm_version: '10.30.0',
      nextjs_version: '16',
      build_passed: false,
      error_summary: 'Type error in components/Foo.tsx',
    });
    expect(result.build_passed).toBe(false);
    expect(result.error_summary).toContain('Type error');
  });

  it('throws when node version is below the 2026 minimum (Node 24)', () => {
    expect(() =>
      createVercelBuildResult({
        node_version: '20',   // below Node 24 minimum
        pnpm_version: '10.30.0',
        nextjs_version: '16',
        build_passed: true,
      })
    ).toThrow(`Node 20 is below the 2026 minimum`);
  });

  it('accepts Node 24 exactly (boundary value)', () => {
    expect(() =>
      createVercelBuildResult({
        node_version: '24',
        pnpm_version: '10.30.0',
        nextjs_version: '16',
        build_passed: true,
      })
    ).not.toThrow();
  });

  it('accepts Node 25+ (above minimum)', () => {
    expect(() =>
      createVercelBuildResult({
        node_version: '25.1.0',
        pnpm_version: '10.30.0',
        nextjs_version: '16',
        build_passed: true,
      })
    ).not.toThrow();
  });

  it('VERCEL_2026_RUNTIME exports the correct canonical targets', () => {
    expect(VERCEL_2026_RUNTIME.node).toBe('24');
    expect(VERCEL_2026_RUNTIME.pnpm).toBe('10.30.0');
    expect(VERCEL_2026_RUNTIME.nextjs_minimum).toBe('16');
  });
});

// ── Generation Law scope enforcement ──────────────────────────────────────────

describe('assessGenerationLawScope', () => {
  it('returns CREATE for a small single-task request', () => {
    const assessment = assessGenerationLawScope('Fix button color.');
    expect(assessment.mode).toBe('CREATE');
    expect(assessment.score).toBeLessThan(4);
  });

  it('returns CONFORM when an existing file is explicitly targeted', () => {
    const assessment = assessGenerationLawScope(
      'Update app/api/ai/idari/route.ts to add one guard.',
    );
    expect(assessment.mode).toBe('CONFORM');
    expect(assessment.score).toBeGreaterThanOrEqual(4);
    expect(assessment.score).toBeLessThan(8);
    expect(assessment.file_count).toBeGreaterThanOrEqual(1);
  });

  it('returns PATCH_ONLY for multi-file schema-sensitive core architecture work', () => {
    const assessment = assessGenerationLawScope(
      'Implement and refactor DreamDMBar and HomeSystem across app/api/ai/idari/route.ts and lib/agents/idari.ts with Supabase schema and RLS updates.',
    );
    expect(assessment.mode).toBe('PATCH_ONLY');
    expect(assessment.score).toBeGreaterThanOrEqual(8);
    expect(assessment.structural_change_risk).toBe(true);
    expect(assessment.core_architecture_hit).toBe(true);
    expect(assessment.dependency_schema_count).toBeGreaterThan(0);
  });
});

describe('formatGenerationLawLoadCheck', () => {
  it('formats the mandatory pre-flight string', () => {
    expect(
      formatGenerationLawLoadCheck({ score: 5.5, mode: 'CONFORM' }),
    ).toBe('LOAD_CHECK: 5.5 | MODE: CONFORM');
  });
});
