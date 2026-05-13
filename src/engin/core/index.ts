// src/engin/core/index.ts

import baseStateSeed from '@/src/engin/state/base.json';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

export type { LedgerEntry, DreamLedger } from './engin.ledger';
export { createLedger, appendEntry } from './engin.ledger';

export type { EnginEvent, EventBus } from './engin.eventbus';
export { createEventBus } from './engin.eventbus';

export type { RenderFrame, RenderLoop } from './engin.renderloop';
export { createRenderLoop } from './engin.renderloop';

export type { EnginSession } from './engin.auth';
export { createSession, validateSession } from './engin.auth';

export type RegistrySlot =
  | 'surface'
  | 'route-surface'
  | 'engine-ruleset'
  | 'connector'
  | 'brain-node'
  | 'brain-doc'
  | 'cartridge'
  | 'persona'
  | 'migration'
  | 'memory'
  | 'dr-eams-tool'
  | 'hook'
  | 'engine-system'
  | 'engine-utility';

export interface RegistryEntry {
  id: string;
  slot: RegistrySlot;
  path: string;
  engine: string;
  exports: string[];
}

interface RegistryDocument {
  generatedAt: string;
  totals: Partial<Record<RegistrySlot, number>>;
  entries: RegistryEntry[];
}

type EngineEventHandler = (payload: unknown) => void;

interface RuleSetDefinition {
  id: string;
  constraints: unknown[];
  transforms:
    | ((state: Record<string, unknown>, params: Record<string, unknown>) => Record<string, unknown>)
    | Record<string, unknown>;
  params: Record<string, unknown>;
}

type LoaderFactory = () => Promise<unknown>;

type RegistryHydrationInput = {
  rulesets: Record<string, LoaderFactory>;
  surfaces: Record<string, LoaderFactory>;
  connectors: Record<string, LoaderFactory>;
  cartridges: Record<string, LoaderFactory>;
  brain: Record<string, LoaderFactory>;
  personas: Record<string, LoaderFactory>;
  systems: Record<string, LoaderFactory>;
  hooks: Record<string, LoaderFactory>;
};

interface ApplyOutcome {
  ruleSetId: string;
  resolvedRuleSetId: string;
  state: Readonly<Record<string, unknown>>;
  snapshot: Readonly<Record<string, unknown>>;
  ruleSet: RuleSetDefinition | null;
}

function cloneUnknown<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const child = record[key];
    if (child !== null && typeof child === 'object') {
      deepFreeze(child);
    }
  }
  return Object.freeze(record) as T;
}

function normalizeState(input: unknown): Record<string, unknown> {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

class EngineRegistry {
  private entriesById = new Map<string, RegistryEntry>();
  private loaders = new Map<string, LoaderFactory>();
  private groupedLoaders: RegistryHydrationInput = {
    rulesets: {},
    surfaces: {},
    connectors: {},
    cartridges: {},
    brain: {},
    personas: {},
    systems: {},
    hooks: {},
  };

  load(entries: RegistryEntry[]): void {
    this.entriesById.clear();
    for (const entry of entries) {
      this.entriesById.set(entry.id, entry);
    }
  }

  hydrate(groups: RegistryHydrationInput): void {
    this.groupedLoaders = groups;
    for (const loaderMap of Object.values(groups)) {
      for (const [id, loader] of Object.entries(loaderMap)) {
        this.loaders.set(id, loader);
      }
    }
  }

  resolveById(id: string): RegistryEntry | null {
    return this.entriesById.get(id) ?? null;
  }

  resolveBySlot(slot: RegistrySlot): RegistryEntry[] {
    return Array.from(this.entriesById.values()).filter((entry) => entry.slot === slot);
  }

  resolveByEngine(engineName: string): RegistryEntry[] {
    return Array.from(this.entriesById.values()).filter((entry) => entry.engine === engineName);
  }

  getLoader(id: string): LoaderFactory | null {
    return this.loaders.get(id) ?? null;
  }

  getGroups(): RegistryHydrationInput {
    return this.groupedLoaders;
  }
}

class AssemblyBusBackedEventBus {
  private listeners = new Map<string, Set<EngineEventHandler>>();
  private queue: Array<{ event: string; payload: unknown }> = [];

  on(event: string, handler: EngineEventHandler): () => void {
    const handlers = this.listeners.get(event) ?? new Set<EngineEventHandler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);

    return () => this.off(event, handler);
  }

  off(event: string, handler: EngineEventHandler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) this.listeners.delete(event);
  }

  emit(event: string, payload: unknown): void {
    this.queue.push({ event, payload });
    while (this.queue.length > 0) {
      const queued = this.queue.shift();
      if (!queued) continue;
      const handlers = this.listeners.get(queued.event);
      if (!handlers) continue;
      for (const handler of handlers) {
        handler(queued.payload);
      }
    }
  }

  reset(): void {
    this.queue = [];
    this.listeners.clear();
  }
}

class UnifiedIO {
  constructor(private readonly registry: EngineRegistry) {}

  getSupabaseClient() {
    return createSupabaseClient();
  }

  async fetchJson(url: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`Engine fetch failed: ${response.status}`);
    }
    return response.json();
  }

  resolveAsset(id: string): RegistryEntry | null {
    return this.registry.resolveById(id);
  }

  resolveBySlot(slot: RegistrySlot): RegistryEntry[] {
    return this.registry.resolveBySlot(slot);
  }

  resolveByEngine(engineName: string): RegistryEntry[] {
    return this.registry.resolveByEngine(engineName);
  }
}

class SecuritySurface {
  readonly capabilityGate = {
    buildActorContext: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/capability-gate');
      return mod.buildActorContext(...(args as Parameters<typeof mod.buildActorContext>));
    },
    authorizeIntent: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/capability-gate');
      return mod.authorizeIntent(...(args as Parameters<typeof mod.authorizeIntent>));
    },
    authorizeIntents: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/capability-gate');
      return mod.authorizeIntents(...(args as Parameters<typeof mod.authorizeIntents>));
    },
    hasCapability: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/capability-gate');
      return mod.hasCapability(...(args as Parameters<typeof mod.hasCapability>));
    },
    meetsMinimumRole: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/capability-gate');
      return mod.meetsMinimumRole(...(args as Parameters<typeof mod.meetsMinimumRole>));
    },
  };

  readonly confirm = {
    generateConfirmToken: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/confirm-token');
      return mod.generateConfirmToken(...(args as Parameters<typeof mod.generateConfirmToken>));
    },
    verifyConfirmToken: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/confirm-token');
      return mod.verifyConfirmToken(...(args as Parameters<typeof mod.verifyConfirmToken>));
    },
    storeConfirmToken: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/confirm-token');
      return mod.storeConfirmToken(...(args as Parameters<typeof mod.storeConfirmToken>));
    },
    consumeConfirmToken: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/confirm-token');
      return mod.consumeConfirmToken(...(args as Parameters<typeof mod.consumeConfirmToken>));
    },
  };

  readonly rateLimiter = {
    checkRateLimit: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/rate-limiter');
      return mod.checkRateLimit(...(args as Parameters<typeof mod.checkRateLimit>));
    },
    getCurrentRPM: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/rate-limiter');
      return mod.getCurrentRPM(...(args as Parameters<typeof mod.getCurrentRPM>));
    },
    getConfig: async () => {
      const mod = await import('@/lib/ai/rate-limiter');
      return mod.RATE_LIMITS;
    },
  };

  readonly idempotency = {
    checkIdempotency: async (...args: unknown[]) => {
      const mod = await import('@/lib/ai/idempotency');
      return mod.checkIdempotency(...(args as Parameters<typeof mod.checkIdempotency>));
    },
  };

  readonly boogieMan = {
    eventName: 'dreamengin:boogieman',
    createAgent: async (...args: unknown[]) => {
      const mod = await import('@/lib/agents/boogieManAI');
      return mod.createBoogieManAgent(...(args as Parameters<typeof mod.createBoogieManAgent>));
    },
    checkPolicy: async (...args: unknown[]) => {
      const mod = await import('@/lib/agents/boogieManAI');
      return mod.checkPolicy(...(args as Parameters<typeof mod.checkPolicy>));
    },
    emitEvent: async (...args: unknown[]) => {
      const mod = await import('@/lib/agents/boogieManAI');
      return mod.emitBoogieManEvent(...(args as Parameters<typeof mod.emitBoogieManEvent>));
    },
    onEvent: async (...args: unknown[]) => {
      const mod = await import('@/lib/agents/boogieManAI');
      return mod.onBoogieManEvent(...(args as Parameters<typeof mod.onBoogieManEvent>));
    },
  };
}

export class UniversalEngine {
  private baseState = deepFreeze(cloneUnknown(normalizeState(baseStateSeed)));
  private activeState = this.baseState;
  private snapshots: Array<Readonly<Record<string, unknown>>> = [this.baseState];
  private activeRuleSetId: string | null = null;
  private booted = false;

  readonly registry = new EngineRegistry();
  readonly events = new AssemblyBusBackedEventBus();
  readonly io = new UnifiedIO(this.registry);
  readonly security = new SecuritySurface();

  async boot(): Promise<void> {
    if (this.booted) return;

    const registryModule = await import('@/build-memory/registry.json');
    const document = (registryModule.default ?? registryModule) as RegistryDocument;
    const entries = Array.isArray(document.entries) ? document.entries : [];
    this.registry.load(entries);

    const generatedModule = await import('../generated/index');
    if (typeof generatedModule.hydrateEngineRegistry === 'function') {
      generatedModule.hydrateEngineRegistry(this);
    }

    this.booted = true;
    this.events.emit('engine:boot', { registryEntries: entries.length });
  }

  shutdown(): void {
    this.booted = false;
    this.activeRuleSetId = null;
    this.resetState();
    this.events.reset();
  }

  getState(): Readonly<Record<string, unknown>> {
    return this.activeState;
  }

  getSnapshots(): ReadonlyArray<Readonly<Record<string, unknown>>> {
    return this.snapshots;
  }

  setState(nextState: Record<string, unknown>): Readonly<Record<string, unknown>> {
    const immutable = deepFreeze(cloneUnknown(normalizeState(nextState)));
    this.activeState = immutable;
    this.snapshots = [...this.snapshots, immutable];
    this.events.emit('engine:state', { state: immutable });
    return immutable;
  }

  resetState(): Readonly<Record<string, unknown>> {
    this.activeState = this.baseState;
    this.snapshots = [this.baseState];
    this.events.emit('engine:reset', { state: this.baseState });
    return this.baseState;
  }

  on(event: string, handler: EngineEventHandler): () => void {
    return this.events.on(event, handler);
  }

  off(event: string, handler: EngineEventHandler): void {
    this.events.off(event, handler);
  }

  emit(event: string, payload: unknown): void {
    this.events.emit(event, payload);
  }

  async apply(ruleSetId: string, baseState?: Record<string, unknown>): Promise<ApplyOutcome> {
    await this.boot();

    if (baseState) {
      this.setState(baseState);
    }

    const resolvedRuleSetId = this.resolveRuleSetId(ruleSetId);
    const loader = this.registry.getLoader(resolvedRuleSetId);

    let ruleSet: RuleSetDefinition | null = null;
    if (loader) {
      const loaded = await loader();
      ruleSet = this.extractRuleSet(loaded, resolvedRuleSetId);
    }

    const currentState = cloneUnknown(this.getState());
    let nextState = currentState;

    if (ruleSet) {
      const transforms = ruleSet.transforms;
      if (typeof transforms === 'function') {
        const transformed = transforms(currentState, ruleSet.params);
        nextState = normalizeState(transformed);
      } else {
        nextState = {
          ...currentState,
          ...normalizeState(transforms),
        };
      }
    }

    const snapshot = this.setState(nextState);
    this.activeRuleSetId = resolvedRuleSetId;
    this.events.emit('engine:apply', {
      requestedRuleSetId: ruleSetId,
      resolvedRuleSetId,
      activeRuleSetId: this.activeRuleSetId,
    });

    return {
      ruleSetId,
      resolvedRuleSetId,
      state: this.getState(),
      snapshot,
      ruleSet,
    };
  }

  async swap(ruleSetId: string): Promise<ApplyOutcome> {
    return this.apply(ruleSetId, cloneUnknown(this.getState()));
  }

  private resolveRuleSetId(requestedId: string): string {
    if (this.registry.resolveById(requestedId)) return requestedId;

    const byEngine = this.registry
      .resolveByEngine(requestedId)
      .find((entry) => entry.slot === 'engine-ruleset');
    if (byEngine) return byEngine.id;

    const fromGroup = Object.keys(this.registry.getGroups().rulesets).find((id) => id === requestedId);
    if (fromGroup) return fromGroup;

    return requestedId;
  }

  private extractRuleSet(moduleValue: unknown, fallbackId: string): RuleSetDefinition | null {
    if (!moduleValue || typeof moduleValue !== 'object') return null;
    const moduleRecord = moduleValue as Record<string, unknown>;
    const candidate =
      (moduleRecord.default as unknown)
      ?? (moduleRecord.ruleSet as unknown)
      ?? (moduleRecord[fallbackId] as unknown)
      ?? moduleRecord;

    if (!candidate || typeof candidate !== 'object') return null;
    const ruleSet = candidate as Record<string, unknown>;

    const id = typeof ruleSet.id === 'string' ? ruleSet.id : fallbackId;
    const constraints = Array.isArray(ruleSet.constraints) ? ruleSet.constraints : [];
    const params = ruleSet.params && typeof ruleSet.params === 'object' && !Array.isArray(ruleSet.params)
      ? (ruleSet.params as Record<string, unknown>)
      : {};

    const transformsRaw = ruleSet.transforms;
    const transforms = typeof transformsRaw === 'function'
      ? transformsRaw as (state: Record<string, unknown>, params: Record<string, unknown>) => Record<string, unknown>
      : normalizeState(transformsRaw);

    return {
      id,
      constraints,
      transforms,
      params,
    };
  }
}

export const engine = new UniversalEngine();
