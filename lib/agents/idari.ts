// lib/agents/idari.ts
// Section 13: IDARi — Admin AI: Debugger / Overseer
//
// IDARi operates alongside InnerDreams as the admin-tier AI.
// It can debug widget issues, oversee system health, and manage widget state.

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
