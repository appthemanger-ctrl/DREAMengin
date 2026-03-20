/**
 * AgentBus: lightweight client-side event bridge between Dr. Eams and IDARi.
 * - No external deps
 * - Safe to import from client components only
 */

export type IdariEventType =
  | 'idari:log'
  | 'idari:status'
  | 'idari:result';

export type IdariEventDetail = {
  type: IdariEventType;
  timestamp: string;
  status?: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};

const EVENT_NAME = 'dreamengin:idari';

export function emitIdariEvent(detail: IdariEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<IdariEventDetail>(EVENT_NAME, { detail }));
}

export function onIdariEvent(handler: (detail: IdariEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<IdariEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

// ── Legacy aliases so any code still importing old names compiles during migration ──
/** @deprecated Use IdariEventType */
export type InnerDreamsEventType = IdariEventType;
/** @deprecated Use IdariEventDetail */
export type InnerDreamsEventDetail = IdariEventDetail;
/** @deprecated Use emitIdariEvent */
export const emitInnerDreamsEvent = emitIdariEvent;
/** @deprecated Use onIdariEvent */
export const onInnerDreamsEvent = onIdariEvent;


// ── Server-side triad consensus gate ────────────────────────────────────────
// Must be imported in server contexts only (Next.js API routes, server actions).
// Phase 6 pt 9: unanimous triad approval required before any major system update.
//
// Import from lib/ai/triad since agentBus itself is client-safe.
// This re-exports the gate as the canonical entry point for callers.

export type { Intent } from '@/lib/ai/schemas';

/**
 * TriadConsensusResult: the output of running all three agents over a message.
 * All three must pass for `unanimous` to be true.
 */
export interface TriadConsensusResult {
  /** True only if Dr. Eams planned, IDARi validated, and Boogie allowed. */
  unanimous: boolean;
  eams: { response_text: string; intents: import('@/lib/ai/schemas').Intent[] };
  idari: { intents: import('@/lib/ai/schemas').Intent[]; notes: string[] };
  boogie: { hard_block: boolean; reason?: string };
}

/**
 * runTriadConsensus — sequence Dr. Eams → IDARi → TheBoogieMan over a message.
 *
 * SERVER-SIDE ONLY.  Never import this from a client component.
 *
 * Returns `{ unanimous: true }` only when:
 *   1. Dr. Eams produced at least one intent (or a non-empty response)
 *   2. IDARi did not strip all intents
 *   3. TheBoogieMan did not hard-block the message
 *
 * Phase 6 pt 9 — consensus gate for major system operations.
 */
export async function runTriadConsensus(input: {
  message: string;
  actorEmail?: string | null;
  actorRole: 'user' | 'admin' | 'owner';
  uiRoute?: string;
}): Promise<TriadConsensusResult> {
  // Dynamic import keeps server modules out of client bundles
  const { planWithEams, validateWithIdari, boogiePolicyCheck } = await import('@/lib/ai/triad');

  const [eamsPlan, boogieResult] = await Promise.all([
    planWithEams(input),
    boogiePolicyCheck({ actorRole: input.actorRole, actorEmail: input.actorEmail, message: input.message }),
  ]);

  const idariResult = validateWithIdari(
    eamsPlan.intents,
    input.actorRole === 'admin' || input.actorRole === 'owner' ? 'admin' : 'user',
  );

  const unanimous =
    !boogieResult.hard_block &&
    (eamsPlan.response_text.trim().length > 0 || eamsPlan.intents.length > 0);

  return {
    unanimous,
    eams:   { response_text: eamsPlan.response_text, intents: eamsPlan.intents },
    idari:  idariResult,
    boogie: boogieResult,
  };
}
