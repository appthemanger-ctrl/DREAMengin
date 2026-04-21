/**
 * tests/enginpipe/orchestration.test.ts
 *
 * Unit tests for the EnginPipe Workflow Orchestration (Component 6).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrchestrator,
  type OrchWorkflowDef,
  type TelemetrySignal,
} from '@/lib/enginpipe/orchestration';

function makeSignal(enginId: 'code', count: number): TelemetrySignal {
  return {
    enginId,
    eventType: 'feature_used',
    count,
    lastSeenAt: Date.now(),
  };
}

describe('enginpipe / orchestration — register & dispatch', () => {
  it('dispatches a registered workflow manually', async () => {
    const orch = createOrchestrator();
    const exec = vi.fn().mockResolvedValue({ done: true });

    const def: OrchWorkflowDef = {
      id:      'test:hello',
      name:    'Hello',
      trigger: { kind: 'manual' },
      execute: exec,
    };

    orch.register(def);
    const record = await orch.dispatch('test:hello', []);
    expect(record.status).toBe('success');
    expect(record.payload).toEqual({ done: true });
    expect(exec).toHaveBeenCalledOnce();
  });

  it('returns failed record for unknown workflow', async () => {
    const orch   = createOrchestrator();
    const record = await orch.dispatch('non:existent');
    expect(record.status).toBe('failed');
    expect(record.error).toMatch('Unknown workflow');
  });

  it('aborts when execute returns null', async () => {
    const orch = createOrchestrator();
    orch.register({
      id:      'test:abort',
      name:    'Abort',
      trigger: { kind: 'manual' },
      execute: async () => null,
    });
    const record = await orch.dispatch('test:abort');
    expect(record.status).toBe('aborted');
  });

  it('marks status as failed when execute throws', async () => {
    const orch = createOrchestrator();
    orch.register({
      id:      'test:throw',
      name:    'Thrower',
      trigger: { kind: 'manual' },
      execute: async () => { throw new Error('boom'); },
    });
    const record = await orch.dispatch('test:throw');
    expect(record.status).toBe('failed');
    expect(record.error).toBe('boom');
  });

  it('unregister prevents future dispatches', async () => {
    const orch = createOrchestrator();
    orch.register({ id: 'test:rm', name: 'X', trigger: { kind: 'manual' }, execute: async () => ({}) });
    orch.unregister('test:rm');
    const record = await orch.dispatch('test:rm');
    expect(record.status).toBe('failed');
  });
});

describe('enginpipe / orchestration — tick / schedule trigger', () => {
  it('fires a schedule workflow when intervalMs has elapsed', async () => {
    vi.useFakeTimers();
    const orch = createOrchestrator();
    const exec = vi.fn().mockResolvedValue({ ticked: true });

    orch.register({
      id:      'sched:fast',
      name:    'Fast scheduler',
      trigger: { kind: 'schedule', intervalMs: 1_000 },
      execute: exec,
    });

    // First tick — should fire (lastFiredAt = 0, interval elapsed).
    const fired1 = await orch.tick([]);
    expect(fired1).toHaveLength(1);
    expect(fired1[0].status).toBe('success');

    // Second tick immediately — should NOT fire (interval not elapsed).
    const fired2 = await orch.tick([]);
    expect(fired2).toHaveLength(0);

    // Advance time past the interval.
    vi.advanceTimersByTime(1_001);
    const fired3 = await orch.tick([]);
    expect(fired3).toHaveLength(1);

    vi.useRealTimers();
  });
});

describe('enginpipe / orchestration — telemetry trigger', () => {
  it('fires when signal count meets threshold', async () => {
    const orch = createOrchestrator();
    const exec = vi.fn().mockResolvedValue({ ok: 1 });

    orch.register({
      id:      'tele:code-surge',
      name:    'Code surge detector',
      trigger: { kind: 'telemetry', enginId: 'code', eventType: 'feature_used', threshold: 10 },
      execute: exec,
    });

    const noFire = await orch.tick([makeSignal('code', 5)]);
    expect(noFire).toHaveLength(0);

    const fired = await orch.tick([makeSignal('code', 15)]);
    expect(fired).toHaveLength(1);
    expect(fired[0].status).toBe('success');
  });
});

describe('enginpipe / orchestration — history', () => {
  it('records history in most-recent-first order', async () => {
    const orch = createOrchestrator();
    orch.register({ id: 'h:a', name: 'A', trigger: { kind: 'manual' }, execute: async () => ({ a: 1 }) });
    orch.register({ id: 'h:b', name: 'B', trigger: { kind: 'manual' }, execute: async () => ({ b: 2 }) });

    await orch.dispatch('h:a');
    await orch.dispatch('h:b');

    const hist = orch.getHistory(5);
    expect(hist[0].workflowId).toBe('h:b');
    expect(hist[1].workflowId).toBe('h:a');
  });

  it('onDispatch callback fires on success', async () => {
    const cb  = vi.fn();
    const orch = createOrchestrator({ onDispatch: cb });
    orch.register({ id: 'cb:x', name: 'X', trigger: { kind: 'manual' }, execute: async () => ({}) });
    await orch.dispatch('cb:x');
    expect(cb).toHaveBeenCalledOnce();
    expect(cb.mock.calls[0][0].status).toBe('success');
  });
});
