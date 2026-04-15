/**
 * lib/engins/workflowEngine.ts
 *
 * Pure workflow state model for the DREAMengin Engin Workflow system.
 *
 * Spec: docs/engin_workflows.md
 *
 * Rules:
 *   - No React, no Supabase, no browser APIs — 100% pure / test-safe.
 *   - All I/O lives in useEnginWorkflow.ts (the hook layer).
 *   - Stage order is forward-only: draft → active → review → export.
 *   - A workflow may be re-activated from review once (reActivated flag).
 *   - Handoffs may only fire from export stage.
 */

// ─── Engin identity ───────────────────────────────────────────────────────────

export type EnginId =
  | 'music'
  | 'games'
  | 'lab'
  | 'code'
  | 'brand'
  | 'create';

// ─── Workflow stage ───────────────────────────────────────────────────────────

export type WorkflowStage = 'draft' | 'active' | 'review' | 'export';

const STAGE_ORDER: readonly WorkflowStage[] = ['draft', 'active', 'review', 'export'];

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  draft:  'Draft',
  active: 'Active',
  review: 'Review',
  export: 'Export',
};

/** Returns true if `to` is a valid forward advance from `from`. */
export function isValidTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  const fi = STAGE_ORDER.indexOf(from);
  const ti = STAGE_ORDER.indexOf(to);
  return ti === fi + 1;
}

// ─── Cross-Engin handoff paths ────────────────────────────────────────────────

export type HandoffKind =
  | 'music:stem-ready'
  | 'music:brand-audio-brief'
  | 'games:script-export'
  | 'games:gameplay-clip'
  | 'games:physics-export'
  | 'lab:dataset-export'
  | 'lab:research-export'
  | 'code:module-inject'
  | 'create:brand-check'
  | 'brand:campaign-draft'
  | 'brand:audio-brief';

export interface HandoffPath {
  readonly kind: HandoffKind;
  readonly from: EnginId;
  readonly to: EnginId;
  /** Human-readable label */
  readonly label: string;
}

/**
 * Canonical 11-path connection network.
 * Spec: docs/engin_workflows.md §4
 */
export const HANDOFF_PATHS: readonly HandoffPath[] = [
  { kind: 'music:stem-ready',         from: 'music',  to: 'create', label: 'Send stems to ContentEngin' },
  { kind: 'music:brand-audio-brief',  from: 'music',  to: 'brand',  label: 'Send audio brief to BrandingEngin' },
  { kind: 'games:script-export',      from: 'games',  to: 'code',   label: 'Export world script to CodeEngin' },
  { kind: 'games:gameplay-clip',      from: 'games',  to: 'create', label: 'Send gameplay clip to ContentEngin' },
  { kind: 'games:physics-export',     from: 'games',  to: 'lab',    label: 'Send physics config to LabEngin' },
  { kind: 'lab:dataset-export',       from: 'lab',    to: 'code',   label: 'Send dataset to CodeEngin' },
  { kind: 'lab:research-export',      from: 'lab',    to: 'create', label: 'Send research to ContentEngin' },
  { kind: 'code:module-inject',       from: 'code',   to: 'games',  label: 'Inject module into GameEngin' },
  { kind: 'create:brand-check',       from: 'create', to: 'brand',  label: 'Send draft to BrandingEngin' },
  { kind: 'brand:campaign-draft',     from: 'brand',  to: 'create', label: 'Send campaign draft to ContentEngin' },
  { kind: 'brand:audio-brief',        from: 'brand',  to: 'music',  label: 'Send audio brief to StarMakerEngin' },
] as const;

/** Returns all handoff paths available from a given Engin. */
export function handoffsFrom(enginId: EnginId): readonly HandoffPath[] {
  return HANDOFF_PATHS.filter((p) => p.from === enginId);
}

// ─── Workflow definition (catalog entry) ──────────────────────────────────────

export interface WorkflowDef {
  /** Namespaced ID: `<enginId>:<slug>` */
  readonly id: string;
  readonly enginId: EnginId;
  readonly name: string;
  readonly handoffKinds: readonly HandoffKind[];
}

/**
 * Canonical workflow catalog.
 * Spec: docs/engin_workflows.md §3
 */
export const WORKFLOW_CATALOG: readonly WorkflowDef[] = [
  // StarMakerEngin
  { id: 'music:beat-composition', enginId: 'music',  name: 'Beat Composition', handoffKinds: ['music:stem-ready', 'music:brand-audio-brief'] },
  { id: 'music:release',          enginId: 'music',  name: 'Track Release',    handoffKinds: ['music:stem-ready'] },
  // GameEngin
  { id: 'games:world-build',      enginId: 'games',  name: 'World Build',      handoffKinds: ['games:script-export', 'games:physics-export'] },
  { id: 'games:score-session',    enginId: 'games',  name: 'Score Session',    handoffKinds: ['games:gameplay-clip'] },
  // LabEngin
  { id: 'lab:experiment',         enginId: 'lab',    name: 'Lab Experiment',   handoffKinds: ['lab:dataset-export', 'lab:research-export'] },
  { id: 'lab:simulation',         enginId: 'lab',    name: 'Simulation Run',   handoffKinds: ['games:physics-export', 'lab:dataset-export'] },
  // CodeEngin
  { id: 'code:sprint',            enginId: 'code',   name: 'Code Sprint',      handoffKinds: ['code:module-inject'] },
  { id: 'code:review',            enginId: 'code',   name: 'Code Review',      handoffKinds: [] },
  // BrandingEngin
  { id: 'brand:campaign',         enginId: 'brand',  name: 'Campaign',         handoffKinds: ['brand:campaign-draft', 'brand:audio-brief'] },
  { id: 'brand:ab-test',          enginId: 'brand',  name: 'A/B Test',         handoffKinds: ['brand:campaign-draft'] },
  // ContentEngin
  { id: 'create:draft',           enginId: 'create', name: 'Content Draft',    handoffKinds: ['create:brand-check'] },
  { id: 'create:publish-queue',   enginId: 'create', name: 'Publish Queue',    handoffKinds: ['create:brand-check'] },
] as const;

/** Returns all workflow definitions for a given Engin. */
export function workflowsForEngin(enginId: EnginId): readonly WorkflowDef[] {
  return WORKFLOW_CATALOG.filter((w) => w.enginId === enginId);
}

/** Looks up a workflow definition by ID. Returns undefined if not found. */
export function findWorkflowDef(workflowId: string): WorkflowDef | undefined {
  return WORKFLOW_CATALOG.find((w) => w.id === workflowId);
}

// ─── Live workflow instance ───────────────────────────────────────────────────

export interface EnginWorkflow {
  /** Namespaced ID — matches WorkflowDef.id */
  readonly id: string;
  readonly enginId: EnginId;
  readonly name: string;
  /** Current lifecycle stage */
  stage: WorkflowStage;
  /** True if the workflow was returned from review → active at least once */
  reActivated: boolean;
  /** True if the workflow has been abandoned (soft-delete) */
  abandoned: boolean;
  /** ISO 8601 timestamp — when this workflow was created */
  readonly createdAt: string;
  /** ISO 8601 timestamp — when the stage last changed */
  updatedAt: string;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a new EnginWorkflow instance in `draft` stage.
 *
 * @param workflowId  Must match a WorkflowDef.id in WORKFLOW_CATALOG.
 * @param now         Optional ISO timestamp override (for deterministic tests).
 */
export function createWorkflow(workflowId: string, now?: string): EnginWorkflow {
  const def = findWorkflowDef(workflowId);
  if (!def) {
    throw new Error(`Unknown workflow ID: "${workflowId}". Check WORKFLOW_CATALOG.`);
  }
  const ts = now ?? new Date().toISOString();
  return {
    id: def.id,
    enginId: def.enginId,
    name: def.name,
    stage: 'draft',
    reActivated: false,
    abandoned: false,
    createdAt: ts,
    updatedAt: ts,
  };
}

// ─── Transitions ─────────────────────────────────────────────────────────────

export type StageTransitionResult =
  | { ok: true; workflow: EnginWorkflow }
  | { ok: false; reason: string };

/**
 * Advance a workflow to the next stage.
 *
 * Returns a new workflow object on success (immutable update).
 * Returns an error object if the transition is invalid.
 *
 * Special case: `review → active` is allowed once per workflow (re-activation).
 *
 * @param workflow  The current workflow instance.
 * @param to        The target stage.
 * @param now       Optional ISO timestamp override (for deterministic tests).
 */
export function advanceStage(
  workflow: EnginWorkflow,
  to: WorkflowStage,
  now?: string,
): StageTransitionResult {
  if (workflow.abandoned) {
    return { ok: false, reason: 'Cannot advance an abandoned workflow.' };
  }
  if (workflow.stage === to) {
    return { ok: false, reason: `Workflow is already in stage "${to}".` };
  }

  // Special re-activation path: review → active (allowed once)
  const isReActivation = workflow.stage === 'review' && to === 'active';
  if (isReActivation) {
    if (workflow.reActivated) {
      return { ok: false, reason: 'Workflow may only be re-activated from review once.' };
    }
    const ts = now ?? new Date().toISOString();
    return {
      ok: true,
      workflow: { ...workflow, stage: 'active', reActivated: true, updatedAt: ts },
    };
  }

  // Normal forward transition
  if (!isValidTransition(workflow.stage, to)) {
    return {
      ok: false,
      reason: `Invalid transition: "${workflow.stage}" → "${to}". Stages advance forward only.`,
    };
  }
  const ts = now ?? new Date().toISOString();
  return {
    ok: true,
    workflow: { ...workflow, stage: to, updatedAt: ts },
  };
}

/**
 * Abandon a workflow. Returns a new workflow with `abandoned: true`.
 * Abandonment is final — no further stage transitions are permitted.
 */
export function abandonWorkflow(workflow: EnginWorkflow, now?: string): EnginWorkflow {
  const ts = now ?? new Date().toISOString();
  return { ...workflow, abandoned: true, updatedAt: ts };
}

// ─── Handoff eligibility ──────────────────────────────────────────────────────

export interface HandoffEligibility {
  readonly eligible: boolean;
  /** Populated only when eligible is true */
  readonly availablePaths: readonly HandoffPath[];
  /** Populated only when eligible is false */
  readonly reason?: string;
}

/**
 * Determine whether a workflow may trigger a cross-Engin handoff.
 *
 * Handoffs are only permitted from a workflow in `export` stage that has
 * at least one registered handoff path.
 */
export function checkHandoffEligibility(workflow: EnginWorkflow): HandoffEligibility {
  if (workflow.abandoned) {
    return { eligible: false, availablePaths: [], reason: 'Workflow is abandoned.' };
  }
  if (workflow.stage !== 'export') {
    return {
      eligible: false,
      availablePaths: [],
      reason: `Handoff requires export stage. Current stage: "${workflow.stage}".`,
    };
  }
  const def = findWorkflowDef(workflow.id);
  if (!def || def.handoffKinds.length === 0) {
    return { eligible: false, availablePaths: [], reason: 'No handoff paths defined for this workflow.' };
  }
  const availablePaths = HANDOFF_PATHS.filter((p) =>
    (def.handoffKinds as readonly string[]).includes(p.kind),
  );
  if (availablePaths.length === 0) {
    return { eligible: false, availablePaths: [], reason: 'No matching handoff paths found.' };
  }
  return { eligible: true, availablePaths };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Returns a short human-readable summary string for a workflow.
 * Useful for bridge event payloads and Journey Trail labels.
 */
export function describeWorkflow(workflow: EnginWorkflow): string {
  const stageLabel = STAGE_LABELS[workflow.stage];
  const suffix = workflow.abandoned ? ' (abandoned)' : '';
  return `${workflow.name} [${stageLabel}]${suffix}`;
}
