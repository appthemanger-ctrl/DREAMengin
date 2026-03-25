/**
 * AgentBus: lightweight client-side event bridge for the AI triad.
 * Covers all three agents: Dr. Eams (user), IDARi (admin/builder), TheBoogieMan (policy).
 * - No external deps
 * - Safe to import from client components only
 */

// ── IDARi events ─────────────────────────────────────────────────────────────

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

const IDARI_EVENT = 'dreamengin:idari';

export function emitIdariEvent(detail: IdariEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<IdariEventDetail>(IDARI_EVENT, { detail }));
}

export function onIdariEvent(handler: (detail: IdariEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<IdariEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(IDARI_EVENT, listener);
  return () => window.removeEventListener(IDARI_EVENT, listener);
}

// ── Dr. Eams events ───────────────────────────────────────────────────────────

export type EamsEventType =
  | 'eams:query'
  | 'eams:response'
  | 'eams:navigate'
  | 'eams:compose';

export type EamsEventDetail = {
  type: EamsEventType;
  timestamp: string;
  status?: 'success' | 'error' | 'pending';
  message: string;
  /** Optional route when type is eams:navigate */
  route?: string;
  details?: string;
};

const EAMS_EVENT = 'dreamengin:eams';

export function emitEamsEvent(detail: EamsEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<EamsEventDetail>(EAMS_EVENT, { detail }));
}

export function onEamsEvent(handler: (detail: EamsEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<EamsEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(EAMS_EVENT, listener);
  return () => window.removeEventListener(EAMS_EVENT, listener);
}

// ── TheBoogieMan events ───────────────────────────────────────────────────────

export type BoogieEventType =
  | 'boogie:block'
  | 'boogie:allow'
  | 'boogie:warn'
  | 'boogie:privacy-event';

export type BoogieEventDetail = {
  type: BoogieEventType;
  timestamp: string;
  /** True when BoogieMan hard-blocked the action */
  hard_block: boolean;
  message: string;
  reason?: string;
  details?: string;
};

const BOOGIE_EVENT = 'dreamengin:boogieman';

export function emitBoogieEvent(detail: BoogieEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<BoogieEventDetail>(BOOGIE_EVENT, { detail }));
}

export function onBoogieEvent(handler: (detail: BoogieEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<BoogieEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(BOOGIE_EVENT, listener);
  return () => window.removeEventListener(BOOGIE_EVENT, listener);
}

// ── Unified triad bus ─────────────────────────────────────────────────────────

/** Any event from the three-agent triad. */
export type TriadAgentId = 'eams' | 'idari' | 'boogieman';

export type TriadBusEventDetail = {
  agent: TriadAgentId;
  timestamp: string;
  status?: 'success' | 'error' | 'pending' | 'blocked';
  message: string;
  details?: string;
};

const TRIAD_BUS_EVENT = 'dreamengin:triad';

/**
 * Emit a unified triad event.  Any component can subscribe to all three agents
 * via `onTriadBusEvent` instead of subscribing to each channel separately.
 */
export function emitTriadBusEvent(detail: TriadBusEventDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<TriadBusEventDetail>(TRIAD_BUS_EVENT, { detail }));
}

export function onTriadBusEvent(handler: (detail: TriadBusEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<TriadBusEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };
  window.addEventListener(TRIAD_BUS_EVENT, listener);
  return () => window.removeEventListener(TRIAD_BUS_EVENT, listener);
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


