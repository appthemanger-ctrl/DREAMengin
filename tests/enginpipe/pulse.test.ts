/**
 * tests/enginpipe/pulse.test.ts
 *
 * Unit tests for the EnginPipe Autonomous Iteration Cycle — The Pulse (Component 7).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPulse,
  PULSE_STAGES,
  type PulseAdapters,
  type ResearchContext,
  type PackageContext,
} from '@/lib/enginpipe/pulse';
import { createBrain, seedDefaultPrinciples } from '@/lib/enginpipe/brain';
import type { TelemetrySignal } from '@/lib/enginpipe/orchestration';

function makeAdapters(overrides: Partial<PulseAdapters> = {}): PulseAdapters {
  return {
    generate: vi.fn().mockResolvedValue({ action: 'build', label: 'Dream Surface' }),
    deploy:   vi.fn().mockResolvedValue(true),
    log:      vi.fn(),
    ...overrides,
  };
}

function makeSignals(count = 2): TelemetrySignal[] {
  return Array.from({ length: count }, (_, i) => ({
    enginId:    'code' as const,
    eventType:  'feature_used',
    count:      i + 1,
    lastSeenAt: Date.now(),
  }));
}

describe('enginpipe / pulse — successful cycle', () => {
  it('returns status success when all stages pass', async () => {
    const brain = createBrain();
    seedDefaultPrinciples(brain);
    const adapters = makeAdapters();
    const pulse    = createPulse({ brain, enginId: 'code', adapters });

    const result = await pulse.run(makeSignals());
    expect(result.status).toBe('success');
    expect(result.lastStage).toBe('log');
    expect(result.snapshot).toBeInstanceOf(Uint8Array);
    expect(result.snapshot!.byteLength).toBeGreaterThan(0);
  });

  it('calls all three adapters: generate, deploy, log', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters();
    const pulse    = createPulse({ brain, enginId: 'music', adapters });

    await pulse.run([]);
    expect(adapters.generate).toHaveBeenCalledOnce();
    expect(adapters.deploy).toHaveBeenCalledOnce();
    expect(adapters.log).toHaveBeenCalledOnce();
  });

  it('passes research context to the generate adapter', async () => {
    const brain = createBrain();
    seedDefaultPrinciples(brain);
    let capturedCtx: ResearchContext | undefined;
    const adapters = makeAdapters({
      generate: vi.fn().mockImplementation(async (ctx: ResearchContext) => {
        capturedCtx = ctx;
        return { label: 'Dream Window', action: 'show' };
      }),
    });
    const pulse = createPulse({ brain, enginId: 'lab', adapters });
    await pulse.run(makeSignals(1));

    expect(capturedCtx).toBeDefined();
    expect(capturedCtx!.signals).toHaveLength(1);
    expect(capturedCtx!.matchedPrinciples.length).toBeGreaterThan(0);
  });
});

describe('enginpipe / pulse — aborted cycle', () => {
  it('aborts when generate returns null', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters({ generate: vi.fn().mockResolvedValue(null) });
    const pulse    = createPulse({ brain, enginId: 'games', adapters });

    const result = await pulse.run([]);
    expect(result.status).toBe('aborted');
    expect(adapters.deploy).not.toHaveBeenCalled();
  });

  it('aborts when quality score falls below minQuality', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters();
    const pulse    = createPulse({ brain, enginId: 'brand', adapters, minQuality: 0.9 });

    // Signal with error events pushes quality below 0.9.
    const errorSignals: TelemetrySignal[] = [
      { enginId: 'code', eventType: 'error_thrown', count: 5, lastSeenAt: Date.now() },
      { enginId: 'code', eventType: 'error_thrown', count: 3, lastSeenAt: Date.now() },
    ];

    const result = await pulse.run(errorSignals);
    expect(result.status).toBe('aborted');
    expect(adapters.generate).not.toHaveBeenCalled();
  });
});

describe('enginpipe / pulse — invalid candidate', () => {
  it('marks cycle as invalid when candidate violates a principle', async () => {
    const brain = createBrain();
    seedDefaultPrinciples(brain);

    // 'public: true' violates the privacy principle.
    const adapters = makeAdapters({
      generate: vi.fn().mockResolvedValue({ public: true, action: 'expose' }),
    });
    const pulse = createPulse({ brain, enginId: 'create', adapters });

    const result = await pulse.run([]);
    expect(result.status).toBe('invalid');
    expect(adapters.deploy).not.toHaveBeenCalled();
  });

  it('marks cycle as invalid for forbidden naming terms', async () => {
    const brain = createBrain();
    seedDefaultPrinciples(brain);

    // "label: 'widget'" violates the naming principle.
    const adapters = makeAdapters({
      generate: vi.fn().mockResolvedValue({ label: 'widget panel', action: 'render' }),
    });
    const pulse = createPulse({ brain, enginId: 'code', adapters });

    const result = await pulse.run([]);
    expect(result.status).toBe('invalid');
  });
});

describe('enginpipe / pulse — deploy failure', () => {
  it('marks cycle as deploy_failed when deploy adapter returns false', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters({ deploy: vi.fn().mockResolvedValue(false) });
    const pulse    = createPulse({ brain, enginId: 'music', adapters });

    const result = await pulse.run([]);
    expect(result.status).toBe('deploy_failed');
  });

  it('marks cycle as deploy_failed when deploy adapter throws', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters({
      deploy: vi.fn().mockRejectedValue(new Error('network down')),
    });
    const pulse = createPulse({ brain, enginId: 'lab', adapters });

    const result = await pulse.run([]);
    expect(result.status).toBe('deploy_failed');
  });
});

describe('enginpipe / pulse — history', () => {
  it('retains cycle history and returns most-recent first', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters();
    const pulse    = createPulse({ brain, enginId: 'code', adapters });

    await pulse.run([]);
    await pulse.run([]);
    await pulse.run([]);

    const hist = pulse.getHistory();
    expect(hist.length).toBe(3);
    // Most-recent first.
    expect(hist[0].startedAt).toBeGreaterThanOrEqual(hist[1].startedAt);
  });

  it('getHistory honours the limit parameter', async () => {
    const brain    = createBrain();
    const adapters = makeAdapters();
    const pulse    = createPulse({ brain, enginId: 'brand', adapters });

    for (let i = 0; i < 5; i++) await pulse.run([]);
    expect(pulse.getHistory(2)).toHaveLength(2);
  });
});

describe('enginpipe / pulse — PULSE_STAGES constant', () => {
  it('exports 7 canonical stages in order', () => {
    expect(PULSE_STAGES).toHaveLength(7);
    expect(PULSE_STAGES[0]).toBe('analyze');
    expect(PULSE_STAGES[6]).toBe('log');
  });
});
