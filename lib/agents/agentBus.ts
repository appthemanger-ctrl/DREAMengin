/**
 * AgentBus: lightweight client-side event bridge between Dr. Eams and iDari.
 * iDari = Inner Dreams AI — the admin optimization agent.
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

// Backward-compatible aliases
export type InnerDreamsEventType = IdariEventType;
export type InnerDreamsEventDetail = IdariEventDetail;
export const emitInnerDreamsEvent = emitIdariEvent;
export const onInnerDreamsEvent = onIdariEvent;
