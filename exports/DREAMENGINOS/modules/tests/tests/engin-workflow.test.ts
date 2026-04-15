import { describe, expect, it } from 'vitest';
import {
  createWorkflow,
  advanceStage,
  abandonWorkflow,
  checkHandoffEligibility,
  describeWorkflow,
  isValidTransition,
  workflowsForEngin,
  handoffsFrom,
  findWorkflowDef,
  WORKFLOW_CATALOG,
  HANDOFF_PATHS,
  STAGE_LABELS,
} from '../lib/engins/workflowEngine';

const NOW = '2026-04-12T08:00:00.000Z';
const LATER = '2026-04-12T09:00:00.000Z';

// ─── Catalog invariants ───────────────────────────────────────────────────────

describe('WORKFLOW_CATALOG', () => {
  it('every entry has a unique id', () => {
    const ids = WORKFLOW_CATALOG.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every id is namespaced as <enginId>:<slug>', () => {
    for (const w of WORKFLOW_CATALOG) {
      const [prefix] = w.id.split(':');
      expect(prefix).toBe(w.enginId);
    }
  });

  it('every handoffKind in a workflow exists in HANDOFF_PATHS', () => {
    const knownKinds = new Set(HANDOFF_PATHS.map((p) => p.kind));
    for (const w of WORKFLOW_CATALOG) {
      for (const kind of w.handoffKinds) {
        expect(knownKinds.has(kind), `Unknown handoffKind "${kind}" in workflow "${w.id}"`).toBe(true);
      }
    }
  });

  it('covers all 6 engins', () => {
    const engins = new Set(WORKFLOW_CATALOG.map((w) => w.enginId));
    expect(engins.size).toBe(6);
  });
});

describe('HANDOFF_PATHS', () => {
  it('has exactly 11 paths', () => {
    expect(HANDOFF_PATHS.length).toBe(11);
  });

  it('every path has distinct from/to', () => {
    for (const p of HANDOFF_PATHS) {
      expect(p.from).not.toBe(p.to);
    }
  });
});

// ─── Stage model ──────────────────────────────────────────────────────────────

describe('isValidTransition', () => {
  it('allows draft → active', () => expect(isValidTransition('draft', 'active')).toBe(true));
  it('allows active → review', () => expect(isValidTransition('active', 'review')).toBe(true));
  it('allows review → export', () => expect(isValidTransition('review', 'export')).toBe(true));
  it('rejects draft → review (skip)', () => expect(isValidTransition('draft', 'review')).toBe(false));
  it('rejects export → draft (backward)', () => expect(isValidTransition('export', 'draft')).toBe(false));
  it('rejects active → draft (backward)', () => expect(isValidTransition('active', 'draft')).toBe(false));
});

describe('STAGE_LABELS', () => {
  it('has a label for every stage', () => {
    expect(STAGE_LABELS.draft).toBeTruthy();
    expect(STAGE_LABELS.active).toBeTruthy();
    expect(STAGE_LABELS.review).toBeTruthy();
    expect(STAGE_LABELS.export).toBeTruthy();
  });
});

// ─── createWorkflow ───────────────────────────────────────────────────────────

describe('createWorkflow', () => {
  it('creates a workflow in draft stage', () => {
    const w = createWorkflow('music:beat-composition', NOW);
    expect(w.stage).toBe('draft');
    expect(w.enginId).toBe('music');
    expect(w.name).toBe('Beat Composition');
    expect(w.abandoned).toBe(false);
    expect(w.reActivated).toBe(false);
    expect(w.createdAt).toBe(NOW);
    expect(w.updatedAt).toBe(NOW);
  });

  it('throws for unknown workflow ID', () => {
    expect(() => createWorkflow('unknown:workflow')).toThrow('Unknown workflow ID');
  });
});

// ─── advanceStage ─────────────────────────────────────────────────────────────

describe('advanceStage', () => {
  it('advances draft → active', () => {
    const w = createWorkflow('music:beat-composition', NOW);
    const result = advanceStage(w, 'active', LATER);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.workflow.stage).toBe('active');
      expect(result.workflow.updatedAt).toBe(LATER);
    }
  });

  it('advances through full lifecycle', () => {
    let w = createWorkflow('code:sprint', NOW);
    const stages: Parameters<typeof advanceStage>[1][] = ['active', 'review', 'export'];
    for (const stage of stages) {
      const result = advanceStage(w, stage, LATER);
      expect(result.ok).toBe(true);
      if (result.ok) w = result.workflow;
    }
    expect(w.stage).toBe('export');
  });

  it('rejects skipping a stage', () => {
    const w = createWorkflow('lab:experiment', NOW);
    const result = advanceStage(w, 'review', LATER);
    expect(result.ok).toBe(false);
  });

  it('rejects backward transition', () => {
    let w = createWorkflow('games:world-build', NOW);
    const r1 = advanceStage(w, 'active', LATER);
    expect(r1.ok).toBe(true);
    if (r1.ok) w = r1.workflow;
    const r2 = advanceStage(w, 'draft', LATER);
    expect(r2.ok).toBe(false);
  });

  it('rejects advancing an abandoned workflow', () => {
    const w = abandonWorkflow(createWorkflow('brand:campaign', NOW), NOW);
    const result = advanceStage(w, 'active', LATER);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('abandoned');
  });

  it('rejects same-stage transition', () => {
    const w = createWorkflow('create:draft', NOW);
    const result = advanceStage(w, 'draft', LATER);
    expect(result.ok).toBe(false);
  });

  it('allows re-activation from review → active once', () => {
    let w = createWorkflow('code:sprint', NOW);
    for (const stage of ['active', 'review'] as const) {
      const r = advanceStage(w, stage, LATER);
      if (r.ok) w = r.workflow;
    }
    const reActivateResult = advanceStage(w, 'active', LATER);
    expect(reActivateResult.ok).toBe(true);
    if (reActivateResult.ok) {
      expect(reActivateResult.workflow.reActivated).toBe(true);
      expect(reActivateResult.workflow.stage).toBe('active');
    }
  });

  it('rejects second re-activation', () => {
    let w = createWorkflow('code:sprint', NOW);
    for (const stage of ['active', 'review'] as const) {
      const r = advanceStage(w, stage, LATER);
      if (r.ok) w = r.workflow;
    }
    // First re-activation
    const r1 = advanceStage(w, 'active', LATER);
    if (r1.ok) w = r1.workflow;
    // Must advance to review again before trying
    const r2 = advanceStage(w, 'review', LATER);
    if (r2.ok) w = r2.workflow;
    // Second re-activation attempt
    const r3 = advanceStage(w, 'active', LATER);
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.reason).toContain('re-activated');
  });
});

// ─── abandonWorkflow ──────────────────────────────────────────────────────────

describe('abandonWorkflow', () => {
  it('marks the workflow as abandoned', () => {
    const w = createWorkflow('create:publish-queue', NOW);
    const abandoned = abandonWorkflow(w, LATER);
    expect(abandoned.abandoned).toBe(true);
    expect(abandoned.updatedAt).toBe(LATER);
  });

  it('does not mutate the original', () => {
    const w = createWorkflow('lab:simulation', NOW);
    abandonWorkflow(w, LATER);
    expect(w.abandoned).toBe(false);
  });
});

// ─── checkHandoffEligibility ─────────────────────────────────────────────────

describe('checkHandoffEligibility', () => {
  it('returns ineligible for non-export stage', () => {
    const w = createWorkflow('music:beat-composition', NOW);
    const r = checkHandoffEligibility(w);
    expect(r.eligible).toBe(false);
    expect(r.reason).toContain('export stage');
  });

  it('returns eligible with paths for export stage', () => {
    let w = createWorkflow('music:beat-composition', NOW);
    for (const stage of ['active', 'review', 'export'] as const) {
      const r = advanceStage(w, stage, LATER);
      if (r.ok) w = r.workflow;
    }
    const r = checkHandoffEligibility(w);
    expect(r.eligible).toBe(true);
    expect(r.availablePaths.length).toBeGreaterThan(0);
  });

  it('returns ineligible for a workflow with no handoff kinds (code:review)', () => {
    let w = createWorkflow('code:review', NOW);
    for (const stage of ['active', 'review', 'export'] as const) {
      const r = advanceStage(w, stage, LATER);
      if (r.ok) w = r.workflow;
    }
    const r = checkHandoffEligibility(w);
    expect(r.eligible).toBe(false);
  });

  it('returns ineligible for an abandoned workflow', () => {
    const w = abandonWorkflow(createWorkflow('brand:campaign', NOW), LATER);
    const r = checkHandoffEligibility(w);
    expect(r.eligible).toBe(false);
  });
});

// ─── describeWorkflow ─────────────────────────────────────────────────────────

describe('describeWorkflow', () => {
  it('includes name and stage label', () => {
    const w = createWorkflow('games:world-build', NOW);
    expect(describeWorkflow(w)).toContain('World Build');
    expect(describeWorkflow(w)).toContain('Draft');
  });

  it('includes (abandoned) for abandoned workflows', () => {
    const w = abandonWorkflow(createWorkflow('brand:ab-test', NOW), NOW);
    expect(describeWorkflow(w)).toContain('abandoned');
  });
});

// ─── workflowsForEngin / handoffsFrom / findWorkflowDef ──────────────────────

describe('workflowsForEngin', () => {
  it('returns only workflows for the given engin', () => {
    const musicWf = workflowsForEngin('music');
    expect(musicWf.every((w) => w.enginId === 'music')).toBe(true);
    expect(musicWf.length).toBeGreaterThan(0);
  });
});

describe('handoffsFrom', () => {
  it('returns only paths from the given engin', () => {
    const paths = handoffsFrom('lab');
    expect(paths.every((p) => p.from === 'lab')).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
  });
});

describe('findWorkflowDef', () => {
  it('finds a known workflow', () => {
    const def = findWorkflowDef('create:draft');
    expect(def).toBeDefined();
    expect(def?.enginId).toBe('create');
  });

  it('returns undefined for unknown ID', () => {
    expect(findWorkflowDef('unknown:x')).toBeUndefined();
  });
});
