/**
 * lib/engins/lab/labEnginRuleSet.ts
 *
 * LabEngin Rule-Set — the ONLY place LabEngin domain logic lives.
 *
 * Domain: physics experiments, simulation runner, quantum circuits,
 * data visualization, and cross-Engin dataset/research exports.
 * Handoff kinds: lab:dataset-export → CodeEngin, lab:research-export → ContentEngin.
 *
 * ZERO infrastructure here: no fetch, no Supabase, no localStorage.
 * The EnginRuntime handles all of that.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Ruleset.
 */

import type {
  EnginAction,
  EnginRuleSetContract,
  EnginRuleSetParams,
  EnginConstraint,
  ConstraintResult,
} from '@/lib/engin-runtime/EnginRuleSetContract';
import {
  patchBaseState,
  type EnginBaseState,
} from '@/lib/engin-runtime/EnginBaseState';
import type { EnginCapability } from '@/lib/engin-runtime/EnginCapabilities';

// ─── Simulation types ─────────────────────────────────────────────────────────

export type SimulationKind = 'particle' | 'fluid' | 'quantum' | 'neural';
export type SimState = 'idle' | 'running' | 'complete';

// ─── Chart type ───────────────────────────────────────────────────────────────

export type ChartType = 'line' | 'bar' | 'scatter';

// ─── Experiment ───────────────────────────────────────────────────────────────

export interface Experiment {
  id: string;
  title: string;
  status: 'draft' | 'running' | 'complete' | 'failed';
}

// ─── Simulation result ────────────────────────────────────────────────────────

export interface SimulationResult {
  kind: SimulationKind;
  result: string;
  completedAt: string;
}

// ─── Domain state shape ───────────────────────────────────────────────────────

export interface LabEnginDerivedState extends Record<string, unknown> {
  lifecycle: EnginBaseState['lifecycle'];
  experiments: Experiment[];
  activeSimulation: SimulationKind | null;
  simState: SimState;
  simResult: SimulationResult | null;
  chartType: ChartType;
  datasetExportReady: boolean;
  researchExportReady: boolean;
  physicsPayload: Record<string, unknown> | null;
}

// ─── Action discriminated union ───────────────────────────────────────────────

export type LabEnginAction =
  | EnginAction<'lab:experiments-loaded',   { experiments: Experiment[] }>
  | EnginAction<'lab:experiment-update',    { id: string; status: Experiment['status'] }>
  | EnginAction<'lab:sim-start',            { kind: SimulationKind }>
  | EnginAction<'lab:sim-complete',         { result: SimulationResult }>
  | EnginAction<'lab:sim-reset',            Record<string, never>>
  | EnginAction<'lab:chart-type',           { type: ChartType }>
  | EnginAction<'lab:dataset-export-ready', Record<string, never>>
  | EnginAction<'lab:research-export-ready', Record<string, never>>
  | EnginAction<'lab:physics-received',     { payload: Record<string, unknown> }>;

// ─── Default domain state ─────────────────────────────────────────────────────

const DEFAULT_DOMAIN: Omit<LabEnginDerivedState, 'lifecycle'> = {
  experiments: [],
  activeSimulation: null,
  simState: 'idle',
  simResult: null,
  chartType: 'line',
  datasetExportReady: false,
  researchExportReady: false,
  physicsPayload: null,
};

// ─── Constraints ──────────────────────────────────────────────────────────────

const simStartConstraint: EnginConstraint<LabEnginAction> = (
  state,
  action,
): ConstraintResult => {
  if (action.type !== 'lab:sim-start') return { valid: true };
  const domain = state.domain as Partial<typeof DEFAULT_DOMAIN>;
  if ((domain.simState ?? 'idle') === 'running') {
    return { valid: false, reason: 'Cannot start a simulation while one is already running.' };
  }
  const { kind } = (action as EnginAction<'lab:sim-start', { kind: SimulationKind }>).payload ?? {};
  const valid_kinds: SimulationKind[] = ['particle', 'fluid', 'quantum', 'neural'];
  if (!kind || !valid_kinds.includes(kind)) {
    return { valid: false, reason: `Unknown simulation kind: "${String(kind)}".` };
  }
  return { valid: true };
};

// ─── Transform ────────────────────────────────────────────────────────────────

function transform(state: EnginBaseState, action: LabEnginAction): EnginBaseState {
  const domain = (state.domain as Partial<typeof DEFAULT_DOMAIN>);

  switch (action.type) {
    case 'lab:experiments-loaded': {
      const { experiments } = (action as EnginAction<'lab:experiments-loaded', { experiments: Experiment[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, experiments } });
    }

    case 'lab:experiment-update': {
      const { id, status } = (action as EnginAction<'lab:experiment-update', { id: string; status: Experiment['status'] }>).payload!;
      const experiments = ((domain.experiments ?? []) as Experiment[]).map(
        (e) => e.id === id ? { ...e, status } : e,
      );
      return patchBaseState(state, { domain: { ...domain, experiments } });
    }

    case 'lab:sim-start': {
      const { kind } = (action as EnginAction<'lab:sim-start', { kind: SimulationKind }>).payload!;
      return patchBaseState(state, {
        lifecycle: 'running',
        domain: { ...domain, activeSimulation: kind, simState: 'running', simResult: null },
      });
    }

    case 'lab:sim-complete': {
      const { result } = (action as EnginAction<'lab:sim-complete', { result: SimulationResult }>).payload!;
      return patchBaseState(state, {
        lifecycle: 'idle',
        domain: { ...domain, simState: 'complete', simResult: result },
      });
    }

    case 'lab:sim-reset': {
      return patchBaseState(state, {
        domain: {
          ...domain,
          activeSimulation: null,
          simState: 'idle',
          simResult: null,
        },
      });
    }

    case 'lab:chart-type': {
      const { type } = (action as EnginAction<'lab:chart-type', { type: ChartType }>).payload!;
      return patchBaseState(state, { domain: { ...domain, chartType: type } });
    }

    case 'lab:dataset-export-ready': {
      return patchBaseState(state, { domain: { ...domain, datasetExportReady: true } });
    }

    case 'lab:research-export-ready': {
      return patchBaseState(state, { domain: { ...domain, researchExportReady: true } });
    }

    case 'lab:physics-received': {
      const { payload } = (action as EnginAction<'lab:physics-received', { payload: Record<string, unknown> }>).payload!;
      return patchBaseState(state, { domain: { ...domain, physicsPayload: payload } });
    }

    default:
      return state;
  }
}

// ─── deriveState ──────────────────────────────────────────────────────────────

function deriveState(state: EnginBaseState): LabEnginDerivedState {
  const d = state.domain as Partial<typeof DEFAULT_DOMAIN>;
  return {
    lifecycle:           state.lifecycle,
    experiments:         (d.experiments         ?? DEFAULT_DOMAIN.experiments)         as Experiment[],
    activeSimulation:    (d.activeSimulation    ?? DEFAULT_DOMAIN.activeSimulation)    as SimulationKind | null,
    simState:            (d.simState            ?? DEFAULT_DOMAIN.simState)            as SimState,
    simResult:           (d.simResult           ?? DEFAULT_DOMAIN.simResult)           as SimulationResult | null,
    chartType:           (d.chartType           ?? DEFAULT_DOMAIN.chartType)           as ChartType,
    datasetExportReady:  (d.datasetExportReady  ?? DEFAULT_DOMAIN.datasetExportReady)  as boolean,
    researchExportReady: (d.researchExportReady ?? DEFAULT_DOMAIN.researchExportReady) as boolean,
    physicsPayload:      (d.physicsPayload      ?? DEFAULT_DOMAIN.physicsPayload)      as Record<string, unknown> | null,
  };
}

// ─── Rule-set params ──────────────────────────────────────────────────────────

const PARAMS: EnginRuleSetParams = {
  enginId: 'lab',
  name: 'LabEngin',
  layoutMode: 'standard',
  accentColor: '#22c55e',
  simulationBudgetMs: 16,
};

const REQUIRED_CAPABILITIES: ReadonlyArray<EnginCapability> = [
  'state:read',
  'state:write',
  'session:start',
  'session:end',
  'scripts:run',
  'bridge:emit',
  'bridge:listen',
];

// ─── Exported rule-set ────────────────────────────────────────────────────────

export const LAB_ENGIN_RULE_SET: EnginRuleSetContract<LabEnginAction> = {
  params: PARAMS,
  requiredCapabilities: REQUIRED_CAPABILITIES,
  constraints: [simStartConstraint],
  transform,
  deriveState,
};
