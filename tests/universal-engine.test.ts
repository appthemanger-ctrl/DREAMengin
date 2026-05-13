import { afterEach, describe, expect, it } from 'vitest';

import { engine } from '@/lib/engine';

afterEach(() => {
  engine.shutdown();
});

describe('universal engine wiring', () => {
  it('boots and applies DrEamsEngin to return a non-null outcome', async () => {
    await engine.boot();

    const result = await engine.apply('DrEamsEngin', {
      seed: 'test',
    });

    expect(result).toBeTruthy();
    expect(result.state).not.toBeNull();
    expect(result.snapshot).not.toBeNull();
    expect(result.ruleSetId).toBe('DrEamsEngin');
  });

  it('loads registry entries and exposes route surfaces via registry lookups', async () => {
    await engine.boot();

    const routeSurfaces = engine.io.resolveBySlot('route-surface');
    expect(routeSurfaces.length).toBeGreaterThan(0);
  });
});
