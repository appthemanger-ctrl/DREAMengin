import { describe, expect, it } from 'vitest';

describe('wire-orphans scanner', () => {
  it('builds a registry document that includes the generated registry file entry', async () => {
    const wireOrphansModule = await import('../scripts/wire-orphans.mjs');
    const result = await wireOrphansModule.buildRegistry({ write: false });

    const entries = result.registry.entries as Array<{ path: string; slot: string }>;
    const registryEntry = entries.find((entry) => entry.path === 'build-memory/registry.json');

    expect(registryEntry).toBeDefined();
    expect(registryEntry?.slot).toBe('memory');
  });
});
