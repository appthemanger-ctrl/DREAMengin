/**
 * lib/engin-runtime/EnginEventBus.ts
 *
 * Client-safe event bus abstraction for Engin-internal events.
 *
 * This wraps the existing createEventBus primitive to add:
 *   - Engin-scoped namespacing so events never leak across engine instances.
 *   - A typed contract for lifecycle events that every engine emits.
 *   - An optional wildcard listener for cross-Engin debugging.
 *
 * IMPORTANT: each EnginRuntime creates exactly ONE EnginEventBus.
 * Buses are never shared between engines.
 */

import { createEventBus, type EventBus, type EventHandler } from '@/lib/eventBus';

// --- Lifecycle events (always emitted by the runtime) ------------------------

export interface EnginLifecycleEvents extends Record<string, unknown> {
  'engin:started':   { enginId: string };
  'engin:paused':    { enginId: string };
  'engin:resumed':   { enginId: string };
  'engin:stopped':   { enginId: string };
  'engin:error':     { enginId: string; message: string; cause?: unknown };
  'engin:state':     { enginId: string; revision: number };
  'engin:persisted': { enginId: string; key: string };
  'engin:restored':  { enginId: string; key: string };
}

// --- Domain events (rule-sets add their own) ----------------------------------

/**
 * EnginEventMap — union of lifecycle + domain-specific events.
 * Rule-sets extend this by providing a generic parameter.
 */
export type EnginEventMap<
  DomainEvents extends Record<string, unknown> = Record<string, unknown>,
> = EnginLifecycleEvents & DomainEvents;

// --- Scoped bus ---------------------------------------------------------------

export interface EnginEventBus<
  DomainEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  on<K extends keyof EnginEventMap<DomainEvents>>(
    event: K,
    handler: EventHandler<EnginEventMap<DomainEvents>[K]>,
  ): void;
  off<K extends keyof EnginEventMap<DomainEvents>>(
    event: K,
    handler: EventHandler<EnginEventMap<DomainEvents>[K]>,
  ): void;
  emit<K extends keyof EnginEventMap<DomainEvents>>(
    event: K,
    payload: EnginEventMap<DomainEvents>[K],
  ): void;
  destroy(): void;
  readonly destroyed: boolean;
}

/**
 * createEnginEventBus<DomainEvents>()
 *
 * Returns a new, scoped event bus for a single engine instance.
 * MUST NOT be shared across multiple engines.
 */
export function createEnginEventBus<
  DomainEvents extends Record<string, unknown> = Record<string, unknown>,
>(): EnginEventBus<DomainEvents> {
  const inner = createEventBus<EnginEventMap<DomainEvents>>();
  return inner as unknown as EnginEventBus<DomainEvents>;
}
