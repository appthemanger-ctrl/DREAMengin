/**
 * lib/engins/code/codeEnginRuleSet.ts
 *
 * CodeEngin Rule-Set — the ONLY place CodeEngin domain logic lives.
 *
 * Domain: polyglot notebook execution (Python/JS/TS/Bash), CI pipeline,
 * security scanning, and cross-Engin module injection.
 * Handoff kind: code:module-inject → GameEngin.
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

// ─── Cell types ───────────────────────────────────────────────────────────────

export type CellLanguage = 'python' | 'javascript' | 'typescript' | 'bash';
export type CellStatus   = 'idle' | 'running' | 'done' | 'error';

export interface NotebookCell {
  id: string;
  language: CellLanguage;
  code: string;
  output: string | null;
  status: CellStatus;
  error?: string;
}

// ─── CI / security types ──────────────────────────────────────────────────────

export type CiStatus = 'idle' | 'running' | 'passed' | 'failed';

export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
}

// ─── Domain state shape ───────────────────────────────────────────────────────

export interface CodeEnginDerivedState extends Record<string, unknown> {
  lifecycle: EnginBaseState['lifecycle'];
  cells: NotebookCell[];
  activeCellId: string | null;
  activeProjectId: string | null;
  ciStatus: CiStatus;
  securityFindings: SecurityFinding[];
  moduleInjected: boolean;
  zoom: number;
}

// ─── Action discriminated union ───────────────────────────────────────────────

export type CodeEnginAction =
  | EnginAction<'code:cell-add',        { cell: NotebookCell }>
  | EnginAction<'code:cell-remove',     { cellId: string }>
  | EnginAction<'code:cell-update',     { cellId: string; code: string }>
  | EnginAction<'code:cell-output',     { cellId: string; output: string; status: CellStatus; error?: string }>
  | EnginAction<'code:cell-activate',   { cellId: string }>
  | EnginAction<'code:cells-load',      { cells: NotebookCell[] }>
  | EnginAction<'code:project-select',  { projectId: string }>
  | EnginAction<'code:ci-start',        Record<string, never>>
  | EnginAction<'code:ci-result',       { status: 'passed' | 'failed' }>
  | EnginAction<'code:security-scan',   { findings: SecurityFinding[] }>
  | EnginAction<'code:module-inject',   Record<string, never>>
  | EnginAction<'code:zoom-set',        { zoom: number }>;

// ─── Default domain state ─────────────────────────────────────────────────────

const DEFAULT_CELLS: NotebookCell[] = [
  {
    id: 'demo-1',
    language: 'python',
    code: '# Python (real Pyodide execution)\nprint("Hello from CodeEngin!")\n2 + 2',
    output: null,
    status: 'idle',
  },
  {
    id: 'demo-2',
    language: 'typescript',
    code: '// TypeScript\nconst greet = (name: string): string => `Hello ${name}`;\ngreet("DREAMengin")',
    output: null,
    status: 'idle',
  },
];

const DEFAULT_DOMAIN: Omit<CodeEnginDerivedState, 'lifecycle'> = {
  cells: DEFAULT_CELLS,
  activeCellId: null,
  activeProjectId: null,
  ciStatus: 'idle',
  securityFindings: [],
  moduleInjected: false,
  zoom: 1.0,
};

// ─── Constraints ──────────────────────────────────────────────────────────────

const cellAddConstraint: EnginConstraint<CodeEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'code:cell-add') return { valid: true };
  const { cell } = (action as EnginAction<'code:cell-add', { cell: NotebookCell }>).payload ?? {};
  if (!cell || !cell.id || !cell.language || typeof cell.code !== 'string') {
    return { valid: false, reason: 'code:cell-add requires a valid NotebookCell.' };
  }
  return { valid: true };
};

const zoomConstraint: EnginConstraint<CodeEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'code:zoom-set') return { valid: true };
  const { zoom } = (action as EnginAction<'code:zoom-set', { zoom: number }>).payload ?? {};
  if (typeof zoom !== 'number' || zoom < 0.6 || zoom > 2.0) {
    return { valid: false, reason: 'Zoom must be between 0.6 and 2.0.' };
  }
  return { valid: true };
};

// ─── Transform ────────────────────────────────────────────────────────────────

function transform(state: EnginBaseState, action: CodeEnginAction): EnginBaseState {
  const domain = (state.domain as Partial<typeof DEFAULT_DOMAIN>);
  const cells  = () => (domain.cells ?? DEFAULT_CELLS) as NotebookCell[];

  switch (action.type) {
    case 'code:cell-add': {
      const { cell } = (action as EnginAction<'code:cell-add', { cell: NotebookCell }>).payload!;
      return patchBaseState(state, { domain: { ...domain, cells: [...cells(), cell] } });
    }

    case 'code:cell-remove': {
      const { cellId } = (action as EnginAction<'code:cell-remove', { cellId: string }>).payload!;
      return patchBaseState(state, {
        domain: { ...domain, cells: cells().filter((c) => c.id !== cellId) },
      });
    }

    case 'code:cell-update': {
      const { cellId, code } = (action as EnginAction<'code:cell-update', { cellId: string; code: string }>).payload!;
      return patchBaseState(state, {
        domain: { ...domain, cells: cells().map((c) => c.id === cellId ? { ...c, code } : c) },
      });
    }

    case 'code:cell-output': {
      const { cellId, output, status, error } = (action as EnginAction<'code:cell-output', { cellId: string; output: string; status: CellStatus; error?: string }>).payload!;
      return patchBaseState(state, {
        domain: {
          ...domain,
          cells: cells().map((c) =>
            c.id === cellId ? { ...c, output, status, error } : c,
          ),
        },
      });
    }

    case 'code:cell-activate': {
      const { cellId } = (action as EnginAction<'code:cell-activate', { cellId: string }>).payload!;
      return patchBaseState(state, { domain: { ...domain, activeCellId: cellId } });
    }

    case 'code:cells-load': {
      const { cells: loaded } = (action as EnginAction<'code:cells-load', { cells: NotebookCell[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, cells: loaded } });
    }

    case 'code:project-select': {
      const { projectId } = (action as EnginAction<'code:project-select', { projectId: string }>).payload!;
      return patchBaseState(state, { domain: { ...domain, activeProjectId: projectId } });
    }

    case 'code:ci-start': {
      return patchBaseState(state, { domain: { ...domain, ciStatus: 'running' } });
    }

    case 'code:ci-result': {
      const { status } = (action as EnginAction<'code:ci-result', { status: 'passed' | 'failed' }>).payload!;
      return patchBaseState(state, { domain: { ...domain, ciStatus: status } });
    }

    case 'code:security-scan': {
      const { findings } = (action as EnginAction<'code:security-scan', { findings: SecurityFinding[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, securityFindings: findings } });
    }

    case 'code:module-inject': {
      return patchBaseState(state, { domain: { ...domain, moduleInjected: true } });
    }

    case 'code:zoom-set': {
      const { zoom } = (action as EnginAction<'code:zoom-set', { zoom: number }>).payload!;
      return patchBaseState(state, { domain: { ...domain, zoom } });
    }

    default:
      return state;
  }
}

// ─── deriveState ──────────────────────────────────────────────────────────────

function deriveState(state: EnginBaseState): CodeEnginDerivedState {
  const d = state.domain as Partial<typeof DEFAULT_DOMAIN>;
  return {
    lifecycle:        state.lifecycle,
    cells:            (d.cells            ?? DEFAULT_DOMAIN.cells)            as NotebookCell[],
    activeCellId:     (d.activeCellId     ?? DEFAULT_DOMAIN.activeCellId)     as string | null,
    activeProjectId:  (d.activeProjectId  ?? DEFAULT_DOMAIN.activeProjectId)  as string | null,
    ciStatus:         (d.ciStatus         ?? DEFAULT_DOMAIN.ciStatus)         as CiStatus,
    securityFindings: (d.securityFindings ?? DEFAULT_DOMAIN.securityFindings) as SecurityFinding[],
    moduleInjected:   (d.moduleInjected   ?? DEFAULT_DOMAIN.moduleInjected)   as boolean,
    zoom:             (d.zoom             ?? DEFAULT_DOMAIN.zoom)             as number,
  };
}

// ─── Rule-set params ──────────────────────────────────────────────────────────

const PARAMS: EnginRuleSetParams = {
  enginId: 'code',
  name: 'CodeEngin',
  layoutMode: 'standard',
  accentColor: '#3b7dd8',
};

const REQUIRED_CAPABILITIES: ReadonlyArray<EnginCapability> = [
  'state:read',
  'state:write',
  'session:start',
  'session:end',
  'scripts:edit',
  'scripts:run',
  'bridge:emit',
  'bridge:listen',
];

// ─── Exported rule-set ────────────────────────────────────────────────────────

export const CODE_ENGIN_RULE_SET: EnginRuleSetContract<CodeEnginAction> = {
  params: PARAMS,
  requiredCapabilities: REQUIRED_CAPABILITIES,
  constraints: [cellAddConstraint, zoomConstraint],
  transform,
  deriveState,
};