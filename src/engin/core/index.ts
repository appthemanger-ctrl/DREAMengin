// src/engin/core/index.ts — barrel export for engin.core namespace
// Immutable infrastructure. No game-specific logic. No dream.* imports.

export type { LedgerEntry, DreamLedger } from './engin.ledger';
export { createLedger, appendEntry } from './engin.ledger';

export type { EnginEvent, EventBus } from './engin.eventbus';
export { createEventBus } from './engin.eventbus';

export type { RenderFrame, RenderLoop } from './engin.renderloop';
export { createRenderLoop } from './engin.renderloop';

export type { EnginSession } from './engin.auth';
export { createSession, validateSession } from './engin.auth';
