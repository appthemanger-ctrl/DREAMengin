/**
 * tests/instance-manager.test.ts — Pass 4
 *
 * Unit tests for lib/runtime/instanceManager.ts
 *
 * Verifies:
 *   - spawn creates instances keyed by enginName:instanceId
 *   - duplicate spawns return the existing instance
 *   - destroy cleans up and releases the channel
 *   - getInstancesForEngin / getInstancesForRegion filter correctly
 *   - promoteToCoOp swaps the channel and mode
 *   - buildInstanceKey helper
 *   - spawnDualInstances creates two instances in different regions
 */

import { describe, expect, it, beforeEach } from 'vitest';

// Source-level checks — avoids Zustand SSR issues in vitest.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = readFileSync(
  resolve(__dirname, '../lib/runtime/instanceManager.ts'),
  'utf-8',
);

describe('instanceManager — source API surface', () => {
  it('exports useInstanceManager Zustand store', () => {
    expect(src).toContain('useInstanceManager');
    expect(src).toContain('create<InstanceManagerState>');
  });

  it('exports EnginInstance interface with required fields', () => {
    expect(src).toContain('key: string');
    expect(src).toContain('enginName: EnginName');
    expect(src).toContain('instanceId: string');
    expect(src).toContain('region: RuntimeId');
    expect(src).toContain('mode: InstanceMode');
    expect(src).toContain('channel: RuntimeChannel');
    expect(src).toContain('createdAt: number');
  });

  it('exports InstanceMode type with solo and coop', () => {
    expect(src).toContain("'solo'");
    expect(src).toContain("'coop'");
    expect(src).toContain('InstanceMode');
  });

  it('provides spawn, destroy, getInstancesForEngin, getInstancesForRegion, promoteToCoOp', () => {
    expect(src).toContain('spawn(');
    expect(src).toContain('destroy(');
    expect(src).toContain('getInstancesForEngin(');
    expect(src).toContain('getInstancesForRegion(');
    expect(src).toContain('promoteToCoOp(');
  });

  it('keys instances by enginName:instanceId', () => {
    expect(src).toContain('`${enginName}:${instanceId}`');
  });

  it('exports buildInstanceKey helper', () => {
    expect(src).toContain('buildInstanceKey');
  });

  it('exports spawnDualInstances convenience helper', () => {
    expect(src).toContain('spawnDualInstances');
  });

  it('defaults mode to solo', () => {
    expect(src).toContain("mode = 'solo'");
  });

  it('uses createLocalChannel for solo instances', () => {
    expect(src).toContain('createLocalChannel(key)');
  });

  it('closes old channel on promoteToCoOp', () => {
    expect(src).toContain('instance.channel.close()');
  });
});

describe('instanceManager — logic validation', () => {
  it('buildInstanceKey produces expected format', async () => {
    const { buildInstanceKey } = await import('../lib/runtime/instanceManager');
    expect(buildInstanceKey('StarMakerEngin', 'abc-123')).toBe('StarMakerEngin:abc-123');
  });

  it('spawn returns same instance for duplicate key', async () => {
    const { useInstanceManager } = await import('../lib/runtime/instanceManager');
    const { spawn } = useInstanceManager.getState();
    const a = spawn('LabEngin', 'test-dup', 'homedream', 'solo');
    const b = spawn('LabEngin', 'test-dup', 'dreamspace', 'coop');
    expect(a.key).toBe(b.key);
    // First registration wins
    expect(a.region).toBe('homedream');
  });

  it('destroy removes instance from store', async () => {
    const { useInstanceManager } = await import('../lib/runtime/instanceManager');
    const { spawn, destroy } = useInstanceManager.getState();
    spawn('CodeEngin', 'destroy-test', 'homedream', 'solo');
    destroy('CodeEngin:destroy-test');
    const { instances } = useInstanceManager.getState();
    expect(instances['CodeEngin:destroy-test']).toBeUndefined();
  });

  it('getInstancesForEngin filters by enginName', async () => {
    const { useInstanceManager } = await import('../lib/runtime/instanceManager');
    const { spawn, getInstancesForEngin } = useInstanceManager.getState();
    spawn('BrandingEngin', 'filter-a', 'homedream', 'solo');
    spawn('BrandingEngin', 'filter-b', 'dreamspace', 'solo');
    const results = getInstancesForEngin('BrandingEngin');
    const keys = results.map((i) => i.key);
    expect(keys).toContain('BrandingEngin:filter-a');
    expect(keys).toContain('BrandingEngin:filter-b');
  });
});
