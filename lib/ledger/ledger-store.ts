/**
 * Server-side LedgerAI singleton.
 *
 * Next.js hot-reload safe: the instance is stored on `globalThis` so it
 * survives module re-evaluations in development.  In production it lives for
 * the lifetime of the serverless function warm-up.
 */

import { LedgerAI } from './LedgerAI';

declare global {
  // eslint-disable-next-line no-var
  var __ledgerAI: LedgerAI | undefined;
}

export function getLedgerAI(): LedgerAI {
  if (!globalThis.__ledgerAI) {
    globalThis.__ledgerAI = new LedgerAI(0.1);
  }
  return globalThis.__ledgerAI;
}

export function resetLedgerAI(): void {
  globalThis.__ledgerAI = new LedgerAI(0.1);
}
