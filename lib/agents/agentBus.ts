/**
 * AgentBus: lightweight client-side event bridge between Dr. Eams, IDARi,
 * BoogieManAI, and InnerDreams.
 * - No external deps
 * - Safe to import from client components only
 *
 * Three-tier AI model (§13):
 *   Dr. Eams    — User AI (Creative / Assistant)
 *   IDARi       — Admin AI (Debugger / Overseer)
 *   BoogieManAI — Policy AI (Policy / Enforcement)
 */

export type AITierName = 'dr_eams' | 'idari' | 'boogieman';

export type InnerDreamsEventType =
  | 'innerdreams:log'
  | 'innerdreams:status'
  | 'innerdreams:result';

export type AITierEventType =
  | 'ai:message'
  | 'ai:policy_check'
  | 'ai:bound';

export type InnerDreamsEventDetail = {
  type: InnerDreamsEventType;
  timestamp: string;
  status?: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};

export type AITierEventDetail = {
  type: AITierEventType;
  from?: AITierName;
  to?: AITierName | 'broadcast';
  action?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

const EVENT_NAME = 'dreamengin:innerdreams';
const AI_EVENT_NAME = 'dreamengin:ai';

// ---- InnerDreams events (existing) ----

export function emitInnerDreamsEvent(detail: InnerDreamsEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<InnerDreamsEventDetail>(EVENT_NAME, { detail }));
}

export function onInnerDreamsEvent(handler: (detail: InnerDreamsEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<InnerDreamsEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

// ---- Three-tier AI events (§13) ----

export function emitAITierEvent(detail: AITierEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AITierEventDetail>(AI_EVENT_NAME, { detail }));
}

export function onAITierEvent(handler: (detail: AITierEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<AITierEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(AI_EVENT_NAME, listener);
  return () => window.removeEventListener(AI_EVENT_NAME, listener);
}
