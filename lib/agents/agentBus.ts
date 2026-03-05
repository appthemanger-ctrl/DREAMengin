/**
 * AgentBus: lightweight client-side event bridge between Dr. Eams and iDari.
 * - No external deps
 * - Safe to import from client components only
 */

export type InnerDreamsEventType =
  | 'innerdreams:log'
  | 'innerdreams:status'
  | 'innerdreams:result';

export type InnerDreamsEventDetail = {
  type: InnerDreamsEventType;
  timestamp: string;
  status?: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};

const EVENT_NAME = 'dreamengin:innerdreams';

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
