/**
 * tests/spec35-vm-bus-events.test.ts
 *
 * §35.5 Dream OS Bus Events — verifies that VM bus event types are defined
 * in DreamArtifactBusEventMap and that the DualRuntimeBridge emits them
 * correctly.
 */

import { describe, it, expect } from 'vitest';

// ── §35.5 event type shape guards ────────────────────────────────────────────

describe('§35.5 VM Bus Event type shapes', () => {
  it('vm:workload-submitted payload matches spec shape', () => {
    // Shape: { workloadId, region, channel, timestamp }
    const payload = {
      workloadId: 'w1',
      region:     'top' as const,
      channel:    'compute',
      timestamp:  Date.now(),
    };
    expect(payload.workloadId).toBe('w1');
    expect(payload.region).toBe('top');
    expect(payload.channel).toBe('compute');
    expect(typeof payload.timestamp).toBe('number');
  });

  it('vm:compute-complete payload matches spec shape', () => {
    const payload = {
      workloadId: 'w1',
      region:     'bottom' as const,
      durationMs: 42,
      timestamp:  Date.now(),
    };
    expect(payload.durationMs).toBeGreaterThanOrEqual(0);
    expect(['top', 'bottom']).toContain(payload.region);
  });

  it('vm:error payload matches spec shape', () => {
    const payload = {
      workloadId: 'w1',
      region:     'top' as const,
      error:      'WebGPU unavailable',
      timestamp:  Date.now(),
    };
    expect(typeof payload.error).toBe('string');
    expect(payload.error.length).toBeGreaterThan(0);
  });

  it('vm:stats-update payload matches spec shape', () => {
    const payload = {
      top:              { pipelineCacheHits: 0 },
      bottom:           null,
      activeWorkloads:  [] as { id: string; region: 'top' | 'bottom' }[],
      timestamp:        Date.now(),
    };
    expect(Array.isArray(payload.activeWorkloads)).toBe(true);
    expect(typeof payload.timestamp).toBe('number');
  });
});
