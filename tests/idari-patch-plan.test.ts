/**
 * tests/idari-patch-plan.test.ts
 *
 * Unit tests for the pure helper functions exported from lib/agents/idari.ts:
 *   - createPatchPlan (req #11, #12, #13)
 *   - createKnownIssue (req #23)
 *   - updateKnownIssueStatus (req #23)
 */

import { describe, it, expect } from 'vitest';
import {
  createPatchPlan,
  createKnownIssue,
  updateKnownIssueStatus,
  type PatchPlan,
  type KnownIssue,
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
