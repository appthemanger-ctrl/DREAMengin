// lib/agents/idari.ts
// Section 13: IDARi — Admin AI: Debugger / Overseer
//
// IDARi operates alongside InnerDreams as the admin-tier AI.
// It can debug widget issues, oversee system health, and manage widget state.
//
// Output format: patch plans (cause → impact → fix → verification).
// See requirements #1–13, #23 from the IDARi system spec.

import type { IDARiAgent } from "@/types/ai";

export const IDARI_EVENT = "dreamengin:idari";

export type IDARiAction = "debug" | "inspect" | "override" | "audit";

export interface IDARiRequest {
  action: IDARiAction;
  target_widget_id?: string;
  payload?: Record<string, unknown>;
}

export interface IDARiResult {
  action: IDARiAction;
  status: "ok" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// PatchPlan — IDARi's primary output format (req #11, #12, #13).
// Every fix is expressed as: cause → impact → fix → verification.
// Rollback steps are required for any change rated "high" or "critical".
// ---------------------------------------------------------------------------

export type PatchRisk = "low" | "medium" | "high" | "critical";

export interface PatchStep {
  /** Relative file path from repo root. */
  file: string;
  /** Minimal diff description or literal unified diff. */
  diff: string;
}

export interface PatchPlan {
  id: string;
  /** One-line summary of the issue. */
  title: string;
  /** Root cause analysis. */
  cause: string;
  /** User / system impact if left unfixed. */
  impact: string;
  /** The smallest safe change that fixes the issue. */
  fix: string;
  /** How to confirm the fix worked (test / metric / visual check). */
  verification: string;
  /** Ordered list of file changes. Always minimal. */
  steps: PatchStep[];
  /** Risk level — determines whether rollback steps are required. */
  risk: PatchRisk;
  /**
   * Rollback instructions (required when risk is "high" or "critical").
   * Describes how to revert if the fix causes regressions.
   */
  rollback?: string;
  created_at: string;
}

/**
 * Create a PatchPlan with the current ISO timestamp and validated rollback
 * requirement (req #13: rollback steps required for risky changes).
 */
export function createPatchPlan(
  plan: Omit<PatchPlan, "created_at">
): PatchPlan {
  if ((plan.risk === "high" || plan.risk === "critical") && !plan.rollback) {
    throw new Error(
      `IDARi: PatchPlan "${plan.title}" has risk="${plan.risk}" but is missing rollback steps (req #13).`
    );
  }
  return { ...plan, created_at: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// KnownIssue — IDARi's "known issues" log (req #23).
// Issues that are identified but not yet patched are tracked here so nothing
// gets silently dropped.
// ---------------------------------------------------------------------------

export type KnownIssueStatus = "open" | "in_progress" | "resolved" | "wont_fix";

export interface KnownIssue {
  id: string;
  title: string;
  description: string;
  status: KnownIssueStatus;
  risk: PatchRisk;
  /** Optional linked PatchPlan id when a fix is in progress. */
  patch_plan_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new open KnownIssue entry with timestamps.
 */
export function createKnownIssue(
  issue: Omit<KnownIssue, "status" | "created_at" | "updated_at">
): KnownIssue {
  const now = new Date().toISOString();
  return { ...issue, status: "open", created_at: now, updated_at: now };
}

/**
 * Update a KnownIssue's status and refreshes `updated_at`.
 */
export function updateKnownIssueStatus(
  issue: KnownIssue,
  status: KnownIssueStatus,
  patch_plan_id?: string
): KnownIssue {
  return {
    ...issue,
    status,
    patch_plan_id: patch_plan_id ?? issue.patch_plan_id,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Agent factory + event bus (existing, unchanged).
// ---------------------------------------------------------------------------

export function createIDARiAgent(widgetId?: string): IDARiAgent {
  return {
    id: "idari-core",
    tier: "idari",
    roles: ["debugger", "overseer"],
    name: "IDARi",
    description: "Admin AI — Debugger / Overseer",
    widget_id: widgetId,
    is_active: true,
  };
}

export function emitIDARiEvent(detail: IDARiResult) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<IDARiResult>(IDARI_EVENT, { detail })
  );
}

export function onIDARiEvent(
  handler: (detail: IDARiResult) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<IDARiResult>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(IDARI_EVENT, listener);
  return () => window.removeEventListener(IDARI_EVENT, listener);
}
