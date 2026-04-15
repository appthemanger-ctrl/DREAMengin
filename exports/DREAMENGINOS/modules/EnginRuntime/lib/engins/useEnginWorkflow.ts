'use client';
/**
 * lib/engins/useEnginWorkflow.ts
 *
 * React hook — manages one EnginWorkflow instance per Engin per user.
 *
 * Spec: docs/engin_workflows.md §7
 *
 * I/O contract:
 *   - localStorage: primary persistence (zero-latency restore)
 *   - bridge.emit: emitted on handoff (fire-and-forget)
 *   - logJourneyDot: emitted on milestone stage transitions (fire-and-forget)
 *
 * Rules:
 *   - Stage transitions require explicit user calls — never auto-advance.
 *   - Handoffs only emit when stage === 'export'.
 *   - localStorage key: `engin_workflow:<workflowId>`
 */

import { useCallback, useEffect, useState } from 'react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { logJourneyDot } from '@/lib/journey/journeyDots';
import {
  type EnginWorkflow,
  type WorkflowStage,
  type HandoffKind,
  createWorkflow,
  advanceStage,
  abandonWorkflow,
  checkHandoffEligibility,
  describeWorkflow,
  findWorkflowDef,
  HANDOFF_PATHS,
} from './workflowEngine';

// ─── Storage helpers (localStorage, best-effort) ─────────────────────────────

function storageKey(workflowId: string): string {
  return `engin_workflow:${workflowId}`;
}

function loadFromStorage(workflowId: string): EnginWorkflow | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(storageKey(workflowId));
    if (!raw) return null;
    return JSON.parse(raw) as EnginWorkflow;
  } catch {
    return null;
  }
}

function saveToStorage(workflow: EnginWorkflow): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey(workflow.id), JSON.stringify(workflow));
  } catch {
    // Best-effort — never throw from storage writes.
  }
}

// ─── Milestone Journey Trail emission ────────────────────────────────────────

function emitMilestone(
  prev: EnginWorkflow,
  next: EnginWorkflow,
): void {
  const domainColor: Record<string, string> = {
    music:  '#a855f7',
    games:  '#c8981a',
    lab:    '#10b981',
    code:   '#22d3ee',
    brand:  '#ec4899',
    create: '#f97316',
  };
  const color = domainColor[next.enginId] ?? '#ffffff';

  if (prev.stage === 'draft' && next.stage === 'active') {
    logJourneyDot({
      kind: 'workflow_first_activation',
      surface: `${next.name} (${next.enginId})`,
      label: `Activated workflow: ${next.name}`,
      significance: 1.0,
      domain_color: color,
      metadata: { workflowId: next.id },
    });
  } else if (prev.stage === 'review' && next.stage === 'export') {
    logJourneyDot({
      kind: 'workflow_first_export',
      surface: `${next.name} (${next.enginId})`,
      label: `Exported workflow: ${next.name}`,
      significance: 0.9,
      domain_color: color,
      metadata: { workflowId: next.id },
    });
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface EnginWorkflowHook {
  /** Current workflow state. null = no workflow loaded. */
  workflow: EnginWorkflow | null;
  /** Load (or restore) a workflow by catalog ID. Creates fresh if not found in storage. */
  loadWorkflow: (workflowId: string) => void;
  /** Advance to the next stage. No-op if transition is invalid. */
  advance: (to: WorkflowStage) => void;
  /** Abandon the current workflow. */
  abandon: () => void;
  /** Emit a cross-Engin handoff event. No-op if workflow is not in export stage. */
  emitHandoff: (kind: HandoffKind, payload?: Record<string, unknown>) => void;
  /** Human-readable status string for UI display. */
  statusLabel: string;
}

/**
 * Manages one workflow instance per workflowId.
 *
 * @example
 * const { workflow, loadWorkflow, advance, emitHandoff } = useEnginWorkflow();
 * useEffect(() => { loadWorkflow('music:beat-composition'); }, [loadWorkflow]);
 */
export function useEnginWorkflow(): EnginWorkflowHook {
  const [workflow, setWorkflow] = useState<EnginWorkflow | null>(null);

  // On mount: restore last active workflow from storage (no-op if nothing stored)
  useEffect(() => {
    // Intentionally passive — caller must call loadWorkflow() explicitly.
  }, []);

  const loadWorkflow = useCallback((workflowId: string) => {
    const stored = loadFromStorage(workflowId);
    if (stored && !stored.abandoned) {
      setWorkflow(stored);
      return;
    }
    // Create fresh — throws if workflowId is not in catalog (surfaces as console error)
    try {
      const fresh = createWorkflow(workflowId);
      saveToStorage(fresh);
      setWorkflow(fresh);
    } catch (err) {
      console.error('[useEnginWorkflow] loadWorkflow failed:', err);
    }
  }, []);

  const advance = useCallback((to: WorkflowStage) => {
    setWorkflow((prev) => {
      if (!prev) return prev;
      const result = advanceStage(prev, to);
      if (!result.ok) {
        // Non-fatal — log only in dev
        if (process.env.NODE_ENV !== 'production') {
          const reason = result.ok === false ? result.reason : '';
          console.warn('[useEnginWorkflow] advance rejected:', reason);
        }
        return prev;
      }
      emitMilestone(prev, result.workflow);
      saveToStorage(result.workflow);
      return result.workflow;
    });
  }, []);

  const abandon = useCallback(() => {
    setWorkflow((prev) => {
      if (!prev) return prev;
      const next = abandonWorkflow(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const emitHandoff = useCallback(
    (kind: HandoffKind, payload: Record<string, unknown> = {}) => {
      if (!workflow) return;
      const eligibility = checkHandoffEligibility(workflow);
      if (!eligibility.eligible) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useEnginWorkflow] emitHandoff blocked:', eligibility.reason);
        }
        return;
      }
      const path = HANDOFF_PATHS.find((p) => p.kind === kind);
      if (!path) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useEnginWorkflow] emitHandoff: unknown kind:', kind);
        }
        return;
      }
      // Verify this kind is registered for the current workflow
      const def = findWorkflowDef(workflow.id);
      if (!def || !(def.handoffKinds as readonly string[]).includes(kind)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useEnginWorkflow] emitHandoff: kind not registered for workflow:', kind);
        }
        return;
      }

      // Emit on the bridge — channel matches HandoffKind prefix
      const channel = kind.split(':')[0] as Parameters<typeof bridge.emit>[0];
      bridge.emit(channel, kind, {
        workflowId: workflow.id,
        workflowName: workflow.name,
        fromEngin: workflow.enginId,
        toEngin: path.to,
        ...payload,
      });

      // Journey Trail — first handoff milestone
      logJourneyDot({
        kind: 'workflow_first_handoff',
        surface: `${workflow.name} (${workflow.enginId})`,
        label: `Handed off to ${path.to}: ${describeWorkflow(workflow)}`,
        significance: 1.0,
        domain_color: '#ffffff',
        metadata: { workflowId: workflow.id, handoffKind: kind },
      });
    },
    [workflow],
  );

  const statusLabel = workflow ? describeWorkflow(workflow) : 'No workflow loaded';

  return { workflow, loadWorkflow, advance, abandon, emitHandoff, statusLabel };
}
