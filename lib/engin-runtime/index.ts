/**
 * lib/engin-runtime/index.ts
 *
 * Barrel export for the universal Engin Runtime Engine.
 *
 * Usage:
 *   import { EnginRuntime, createEnginRuntime } from '@/lib/engin-runtime';
 */

export {
  createBaseState,
  patchBaseState,
} from './EnginBaseState';
export type {
  EnginBaseState,
  EnginLifecycle,
} from './EnginBaseState';

export {
  createEnginEventBus,
} from './EnginEventBus';
export type {
  EnginEventBus,
  EnginEventMap,
  EnginLifecycleEvents,
} from './EnginEventBus';

export {
  LocalStorageAdapter,
  MemoryAdapter,
  enginStorageKey,
} from './EnginIOAdapter';
export type {
  EnginIOAdapter,
} from './EnginIOAdapter';

export {
  DEFAULT_USER_CAPABILITIES,
  DENY_ALL,
  gateCapability,
  mergeCapabilities,
} from './EnginCapabilities';
export type {
  EnginCapability,
  EnginCapabilityMap,
  CapabilityGateResult,
} from './EnginCapabilities';

export type {
  EnginAction,
  EnginRuleSetParams,
  EnginRuleSetContract,
  EnginConstraint,
  EnginTransform,
  ConstraintResult,
} from './EnginRuleSetContract';

export {
  EnginRuntime,
} from './EnginRuntime';
export type {
  EnginRuntimeOptions,
} from './EnginRuntime';

// --- Factory helper -----------------------------------------------------------

import { EnginRuntime } from './EnginRuntime';
import type { EnginAction, EnginRuleSetContract } from './EnginRuleSetContract';
import type { EnginRuntimeOptions } from './EnginRuntime';

/**
 * createEnginRuntime(ruleSet, options?)
 *
 * Convenience factory — identical to `new EnginRuntime(...)` but avoids
 * callers needing to import the class directly.
 */
export function createEnginRuntime<
  A extends EnginAction = EnginAction,
  DomainEvents extends Record<string, unknown> = Record<string, unknown>,
>(
  ruleSet: EnginRuleSetContract<A>,
  options?: EnginRuntimeOptions,
): EnginRuntime<A, DomainEvents> {
  return new EnginRuntime<A, DomainEvents>(ruleSet, options);
}
