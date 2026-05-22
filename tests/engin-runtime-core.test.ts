/**
 * tests/engin-runtime-core.test.ts
 *
 * Unit tests for the universal Engin Runtime Engine:
 *   - Base state creation and patching
 *   - Capability gating
 *   - Rule-set constraint enforcement
 *   - Transform application
 *   - Event bus emissions
 *   - Persistence adapter (MemoryAdapter)
 *   - EnginRuntime lifecycle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBaseState, patchBaseState } from '@/lib/engin-runtime/EnginBaseState';
import {
  gateCapability,
  mergeCapabilities,
  DEFAULT_USER_CAPABILITIES,
  DENY_ALL,
} from '@/lib/engin-runtime/EnginCapabilities';
import { MemoryAdapter, LocalStorageAdapter, enginStorageKey } from '@/lib/engin-runtime/EnginIOAdapter';
import { createEnginEventBus } from '@/lib/engin-runtime/EnginEventBus';
import { EnginRuntime, createEnginRuntime } from '@/lib/engin-runtime';
import type { EnginRuleSetContract, EnginAction } from '@/lib/engin-runtime/EnginRuleSetContract';
import type { EnginBaseState } from '@/lib/engin-runtime/EnginBaseState';

// ─── Minimal stub rule-set for testing ───────────────────────────────────────

type CounterAction =
  | EnginAction<'counter:increment', { by: number }>
  | EnginAction<'counter:reset'>;

const counterRuleSet: EnginRuleSetContract<CounterAction> = {
  params: {
    enginId: 'test',
    name: 'TestEngin',
    layoutMode: 'standard',
    accentColor: '#ffffff',
  },
  requiredCapabilities: ['state:read', 'state:write'],
  constraints: [
    (_state, action) => {
      if (action.type === 'counter:increment') {
        const { by } = (action as EnginAction<'counter:increment', { by: number }>).payload ?? { by: 0 };
        if (by < 0) return { valid: false, reason: 'Increment must be non-negative.' };
      }
      return { valid: true };
    },
  ],
  transform(state: EnginBaseState, action: CounterAction): EnginBaseState {
    switch (action.type) {
      case 'counter:increment': {
        const { by } = (action as EnginAction<'counter:increment', { by: number }>).payload ?? { by: 0 };
        const prev = (state.domain.count as number | undefined) ?? 0;
        return patchBaseState(state, { domain: { count: prev + by } });
      }
      case 'counter:reset':
        return patchBaseState(state, { domain: { count: 0 } });
      default:
        return state;
    }
  },
  deriveState(state: EnginBaseState) {
    return { count: (state.domain.count as number | undefined) ?? 0, lifecycle: state.lifecycle };
  },
};

// ─── EnginBaseState ───────────────────────────────────────────────────────────

describe('EnginBaseState', () => {
  it('createBaseState returns correct initial values', () => {
    const state = createBaseState('music');
    expect(state.enginId).toBe('music');
    expect(state.lifecycle).toBe('idle');
    expect(state.revision).toBe(0);
    expect(state.domain).toEqual({});
    expect(state.updatedAt).toBeTruthy();
  });

  it('patchBaseState increments revision', () => {
    const s0 = createBaseState('code');
    const s1 = patchBaseState(s0, { lifecycle: 'running' });
    expect(s1.revision).toBe(1);
    expect(s1.lifecycle).toBe('running');
    expect(s1.enginId).toBe('code');
  });

  it('patchBaseState merges domain', () => {
    const s0 = createBaseState('games');
    const s1 = patchBaseState(s0, { domain: { score: 100 } });
    const s2 = patchBaseState(s1, { domain: { level: 2 } });
    expect(s2.domain).toEqual({ score: 100, level: 2 });
  });

  it('patchBaseState does not mutate previous state', () => {
    const s0 = createBaseState('lab');
    const s1 = patchBaseState(s0, { domain: { x: 1 } });
    expect(s0.domain).toEqual({});
    expect(s1.domain).toEqual({ x: 1 });
  });
});

// ─── Capability gating ────────────────────────────────────────────────────────

describe('EnginCapabilities', () => {
  it('gateCapability: grants permitted capabilities', () => {
    const result = gateCapability(DEFAULT_USER_CAPABILITIES, 'state:read');
    expect(result.granted).toBe(true);
  });

  it('gateCapability: denies missing capabilities', () => {
    const result = gateCapability(DEFAULT_USER_CAPABILITIES, 'persistence:remote');
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('persistence:remote');
  });

  it('gateCapability: DENY_ALL denies everything', () => {
    expect(gateCapability(DENY_ALL, 'state:read').granted).toBe(false);
    expect(gateCapability(DENY_ALL, 'session:start').granted).toBe(false);
  });

  it('mergeCapabilities: override overrides base', () => {
    const merged = mergeCapabilities(DENY_ALL, { 'state:read': true });
    expect(gateCapability(merged, 'state:read').granted).toBe(true);
    expect(gateCapability(merged, 'state:write').granted).toBe(false);
  });
});

// ─── EnginIOAdapter — MemoryAdapter ──────────────────────────────────────────

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it('save and load a value', async () => {
    await adapter.save('key1', { foo: 'bar' });
    const val = await adapter.load<{ foo: string }>('key1');
    expect(val).toEqual({ foo: 'bar' });
  });

  it('returns null for unknown key', async () => {
    const val = await adapter.load('nope');
    expect(val).toBeNull();
  });

  it('remove deletes the key and returns true', async () => {
    await adapter.save('k', 42);
    const removed = await adapter.remove('k');
    expect(removed).toBe(true);
    expect(await adapter.load('k')).toBeNull();
  });

  it('remove on non-existent key returns false', async () => {
    const removed = await adapter.remove('ghost');
    expect(removed).toBe(false);
  });
});

// ─── enginStorageKey helper ───────────────────────────────────────────────────

describe('enginStorageKey', () => {
  it('namespaces key correctly', () => {
    expect(enginStorageKey('games', 'domain-state')).toBe('de:engin:games:domain-state');
  });
});

// ─── Event bus ────────────────────────────────────────────────────────────────

describe('EnginEventBus', () => {
  it('emits and receives lifecycle events', () => {
    const bus = createEnginEventBus();
    const handler = vi.fn();
    bus.on('engin:started', handler);
    bus.emit('engin:started', { enginId: 'test' });
    expect(handler).toHaveBeenCalledWith({ enginId: 'test' });
  });

  it('off unsubscribes a handler', () => {
    const bus = createEnginEventBus();
    const handler = vi.fn();
    bus.on('engin:stopped', handler);
    bus.off('engin:stopped', handler);
    bus.emit('engin:stopped', { enginId: 'test' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('destroy prevents further emissions', () => {
    const bus = createEnginEventBus();
    bus.destroy();
    expect(bus.destroyed).toBe(true);
    expect(() => bus.emit('engin:started', { enginId: 'test' })).toThrow();
  });
});

// ─── EnginRuntime ─────────────────────────────────────────────────────────────

describe('EnginRuntime', () => {
  let runtime: EnginRuntime<CounterAction>;

  beforeEach(() => {
    runtime = createEnginRuntime(counterRuleSet, {
      ioAdapter: new MemoryAdapter(),
      persistenceKey: 'state',
    });
  });

  it('initial state is idle with empty domain', () => {
    expect(runtime.state.lifecycle).toBe('idle');
    expect(runtime.state.domain).toEqual({});
  });

  it('getDerivedState returns count:0 by default', () => {
    const d = runtime.getDerivedState();
    expect(d.count).toBe(0);
  });

  it('dispatch increments counter', () => {
    runtime.dispatch({ type: 'counter:increment', payload: { by: 5 } });
    expect(runtime.getDerivedState().count).toBe(5);
  });

  it('dispatch applies multiple transforms correctly', () => {
    runtime.dispatch({ type: 'counter:increment', payload: { by: 3 } });
    runtime.dispatch({ type: 'counter:increment', payload: { by: 7 } });
    expect(runtime.getDerivedState().count).toBe(10);
    runtime.dispatch({ type: 'counter:reset' });
    expect(runtime.getDerivedState().count).toBe(0);
  });

  it('dispatch rejects action that fails constraint', () => {
    const result = runtime.dispatch({ type: 'counter:increment', payload: { by: -1 } });
    expect(result).toBe(false);
    expect(runtime.getDerivedState().count).toBe(0);
  });

  it('dispatch returns true on success', () => {
    const ok = runtime.dispatch({ type: 'counter:increment', payload: { by: 1 } });
    expect(ok).toBe(true);
  });

  it('bus emits engin:state on successful dispatch', () => {
    const handler = vi.fn();
    runtime.bus.on('engin:state', handler);
    runtime.dispatch({ type: 'counter:increment', payload: { by: 1 } });
    expect(handler).toHaveBeenCalled();
  });

  it('bus emits engin:error when constraint fails', () => {
    const handler = vi.fn();
    runtime.bus.on('engin:error', handler);
    runtime.dispatch({ type: 'counter:increment', payload: { by: -1 } });
    expect(handler).toHaveBeenCalled();
  });

  it('start transitions lifecycle to running', () => {
    runtime.start();
    expect(runtime.state.lifecycle).toBe('running');
  });

  it('pause + resume cycle works', () => {
    runtime.start();
    runtime.pause();
    expect(runtime.state.lifecycle).toBe('paused');
    runtime.resume();
    expect(runtime.state.lifecycle).toBe('running');
  });

  it('stop marks bus as destroyed', () => {
    runtime.start();
    runtime.stop();
    expect(runtime.bus.destroyed).toBe(true);
  });

  it('persist and restore round-trips domain state', async () => {
    runtime.dispatch({ type: 'counter:increment', payload: { by: 42 } });
    // Allow the async persist to settle
    await new Promise((r) => setTimeout(r, 10));

    // Create a new runtime with the same adapter (shared MemoryAdapter)
    const adapter = new MemoryAdapter();
    await adapter.save('state', runtime.state.domain);
    const runtime2 = createEnginRuntime(counterRuleSet, { ioAdapter: adapter, persistenceKey: 'state' });
    const restored = await runtime2.restore();
    expect(restored).toBe(true);
    expect(runtime2.getDerivedState().count).toBe(42);
  });

  it('capability gate: action with __capability key is checked', () => {
    const restrictedRuntime = createEnginRuntime(counterRuleSet, {
      ioAdapter: new MemoryAdapter(),
      capabilities: DENY_ALL,
    });
    const actionWithCap = { type: 'counter:increment', payload: { by: 1 }, __capability: 'state:write' } as any as CounterAction;
    const result = restrictedRuntime.dispatch(actionWithCap);
    expect(result).toBe(false);
  });
});