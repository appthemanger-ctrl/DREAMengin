// lib/agents/boogieManAI.ts
// Section 13: BoogieManAI — Policy / Enforcement
//
// BoogieManAI enforces platform policies.
// It lives inside widgets, not above the system.

import type { BoogieManAgent } from "@/types/ai";

export const BOOGIEMAN_EVENT = "dreamengin:boogieman";

export type PolicyVerdict = "allow" | "warn" | "block";

export interface PolicyCheck {
  content_id?: string;
  widget_id?: string;
  action: string;
  context?: Record<string, unknown>;
}

export interface PolicyResult {
  verdict: PolicyVerdict;
  reason?: string;
  rule_id?: string;
}

export function createBoogieManAgent(widgetId?: string): BoogieManAgent {
  return {
    id: "boogieman-core",
    tier: "boogieman",
    roles: ["policy", "enforcement"],
    name: "TheBoogieMan.Ai",
    description: "Policy / Enforcement AI",
    widget_id: widgetId,
    is_active: true,
  };
}

export function checkPolicy(check: PolicyCheck): PolicyResult {
  // Default-allow: concrete enforcement rules are registered per-deployment.
  // Callers should layer additional checks on top of this baseline.
  return { verdict: "allow" };
}

export function emitBoogieManEvent(detail: PolicyResult) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PolicyResult>(BOOGIEMAN_EVENT, { detail })
  );
}

export function onBoogieManEvent(
  handler: (detail: PolicyResult) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<PolicyResult>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(BOOGIEMAN_EVENT, listener);
  return () => window.removeEventListener(BOOGIEMAN_EVENT, listener);
}
