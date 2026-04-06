// lib/agents/idari.ts
// Section 13: IDARi — Admin AI: Debugger / Overseer
//
// IDARi is the admin-tier AI agent for DREAMengin.
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
// Generation Law — Phase 8 runtime-complete scope enforcement.
// Provides deterministic pre-flight scoring used by IDARi system instructions.
// ---------------------------------------------------------------------------

export type GenerationLawMode = "CREATE" | "CONFORM" | "PATCH_ONLY";

export interface GenerationLawAssessment {
  score: number;
  mode: GenerationLawMode;
  task_count: number;
  file_count: number;
  dependency_schema_count: number;
  vague_term_count: number;
  core_architecture_hit: boolean;
  structural_change_risk: boolean;
}

export const GENERATION_LAW_WEIGHTS = {
  w1_task: 2.0,
  w2_file: 0.5,
  w3_dependency_db: 4.0,
  w4_architecture: 3.0,
  w5_ambiguity: 1.5,
} as const;

const TASK_PATTERNS = [
  /\b(add|build|change|create|delete|emit|enforce|fix|generate|implement|improve|introduce|modify|move|optimi[sz]e|patch|propose|refactor|remove|rename|replace|update|wire)\b/gi,
  /\b(and|then)\b/gi,
] as const;

const FILE_PATTERNS = [
  /\b[a-z0-9_./-]+\.[a-z0-9]+\b/gi,
  /\b(app|components|lib|types|utils|tests|scripts|supabase)\/[a-z0-9_./-]+\b/gi,
] as const;

const DEPENDENCY_SCHEMA_PATTERN =
  /\b(database|dependency|dependencies|deps|install|migration|package|pnpm|npm|schema|schemas|supabase|table|tables|column|columns|rls|policy|policies|rpc)\b/gi;

const CORE_ARCHITECTURE_PATTERN = /\b(DreamDMBar|DreamDM Bar|HomeSystem|RLS)\b/i;

const VAGUE_TERMS_PATTERN =
  /\b(around|etc|eventually|kind of|maybe|possibly|roughly|some|somehow|something|stuff|things|whatever)\b/gi;

function countMatches(source: string, pattern: RegExp): number {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function countUniqueMatches(source: string, pattern: RegExp): number {
  const matches = source.match(pattern);
  return matches ? new Set(matches.map((match) => match.toLowerCase())).size : 0;
}

export function assessGenerationLawScope(message: string): GenerationLawAssessment {
  const source = message.trim();
  const task_count = Math.max(
    1,
    TASK_PATTERNS.reduce((total, pattern) => total + countMatches(source, pattern), 0),
  );
  const file_count = Math.max(
    0,
    FILE_PATTERNS.reduce((max, pattern) => Math.max(max, countUniqueMatches(source, pattern)), 0),
  );
  const dependency_schema_count = countUniqueMatches(source, DEPENDENCY_SCHEMA_PATTERN);
  const vague_term_count = countMatches(source, VAGUE_TERMS_PATTERN);
  const core_architecture_hit = CORE_ARCHITECTURE_PATTERN.test(source);

  const score =
    (GENERATION_LAW_WEIGHTS.w1_task * task_count) +
    (GENERATION_LAW_WEIGHTS.w2_file * file_count) +
    (GENERATION_LAW_WEIGHTS.w3_dependency_db * dependency_schema_count) +
    (GENERATION_LAW_WEIGHTS.w4_architecture * (core_architecture_hit ? 1 : 0)) +
    (GENERATION_LAW_WEIGHTS.w5_ambiguity * vague_term_count);

  const mode: GenerationLawMode =
    score < 4
      ? "CREATE"
      : score < 8
        ? "CONFORM"
        : "PATCH_ONLY";

  return {
    score,
    mode,
    task_count,
    file_count,
    dependency_schema_count,
    vague_term_count,
    core_architecture_hit,
    structural_change_risk:
      file_count > 1 ||
      dependency_schema_count > 0 ||
      core_architecture_hit ||
      task_count > 1,
  };
}

export function formatGenerationLawLoadCheck(
  assessment: Pick<GenerationLawAssessment, "score" | "mode">,
): string {
  return `LOAD_CHECK: ${assessment.score.toFixed(1)} | MODE: ${assessment.mode}`;
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

// ---------------------------------------------------------------------------
// SpecCheck — IDARi verifies spec requirements before building or upgrading
// any part of the platform (mirrors portfolio-optimizer "build" job pattern).
// Every build / upgrade cycle must pass spec-check before changes are applied.
// ---------------------------------------------------------------------------

/** Status of a single spec requirement. */
export type SpecRequirementStatus = "met" | "partial" | "missing";

/** A single verifiable requirement drawn from the project spec. */
export interface SpecRequirement {
  /** Short unique key, e.g. "homedream-route". */
  id: string;
  /** Architectural area, e.g. "core-surfaces", "ai-triad", "privacy". */
  area: string;
  /** Human-readable description of what must be true. */
  description: string;
  /** Current satisfaction state. */
  status: SpecRequirementStatus;
  /** Optional detail — why it is partial or missing. */
  notes?: string;
}

/**
 * Aggregate result of one spec-check run.
 * overall is "fail" when any requirement is "missing",
 *             "warn" when any is "partial" but none are "missing",
 *             "pass" when all are "met".
 */
export interface SpecCheckResult {
  timestamp: string;
  /** Identifies the spec version being checked (e.g. "dreamengin_phase6"). */
  spec_version: string;
  requirements: SpecRequirement[];
  overall: "pass" | "warn" | "fail";
  unmet_count: number;
  partial_count: number;
}

/**
 * Evaluate a list of spec requirements and produce a SpecCheckResult.
 * Call this before applying any PatchPlan to confirm the target area is
 * spec-compliant.
 */
export function evaluateSpecRequirements(
  specVersion: string,
  requirements: SpecRequirement[]
): SpecCheckResult {
  const unmetCount = requirements.filter((r) => r.status === "missing").length;
  const partialCount = requirements.filter((r) => r.status === "partial").length;
  const overall: SpecCheckResult["overall"] =
    unmetCount > 0 ? "fail" : partialCount > 0 ? "warn" : "pass";

  return {
    timestamp: new Date().toISOString(),
    spec_version: specVersion,
    requirements,
    overall,
    unmet_count: unmetCount,
    partial_count: partialCount,
  };
}

// ---------------------------------------------------------------------------
// VercelBuildResult — IDARi records whether the codebase builds cleanly on the
// Vercel-equivalent runtime (mirrors portfolio-optimizer "optimize" job that
// runs only after the "build" job passes).
// 2026 target runtime: Node 25, pnpm 10.30.0, Next.js 16+.
// ---------------------------------------------------------------------------

/** Known 2026 Vercel-compatible runtime targets (docs/ARCHITECTURE.md §10). */
export const VERCEL_2026_RUNTIME = {
  node: "25",
  pnpm: "10.30.0",
  nextjs_minimum: "16",
} as const;

/** Result of a Vercel-compatible build verification run. */
export interface VercelBuildResult {
  timestamp: string;
  /** Node.js version used, e.g. "25". */
  node_version: string;
  /** pnpm version used, e.g. "10.30.0". */
  pnpm_version: string;
  /** Next.js major version detected, e.g. "16". */
  nextjs_version: string;
  /** True when `next build` exited 0. */
  build_passed: boolean;
  /** Number of routes compiled (from build output), if available. */
  route_count?: number;
  /** First error line from build output when build_passed is false. */
  error_summary?: string;
}

/**
 * Create a VercelBuildResult record.
 * Validates that the reported runtime meets VERCEL_2026_RUNTIME minimums
 * and throws when the node or pnpm version is below the 2026 target.
 */
export function createVercelBuildResult(
  result: Omit<VercelBuildResult, "timestamp">
): VercelBuildResult {
  const nodeMajor = parseInt(result.node_version.split(".")[0], 10);
  const requiredNode = parseInt(VERCEL_2026_RUNTIME.node, 10);
  if (nodeMajor < requiredNode) {
    throw new Error(
      `IDARi VercelBuildResult: Node ${result.node_version} is below the 2026 ` +
        `minimum of Node ${VERCEL_2026_RUNTIME.node} (docs/ARCHITECTURE.md §10).`
    );
  }
  return { ...result, timestamp: new Date().toISOString() };
}
