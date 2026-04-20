/**
 * tests/drop-target-registry.test.ts — Pass 6
 *
 * Unit tests for lib/runtime/dropTargetRegistry.ts
 *
 * Verifies:
 *   - register / unregister lifecycle
 *   - route delivers to the best-matching target
 *   - priority ordering works
 *   - accepts filter is respected
 *   - getTargetsForRegion filtering
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { dropTargetRegistry } from '../lib/runtime/dropTargetRegistry';
import type { DreamDrop } from '../lib/runtime/coercionTable';

// Helper to build a minimal DreamDrop
function makeDrop(type: DreamDrop['type'] = 'image'): DreamDrop {
  return { type, content: 'test', timestamp: Date.now() };
}

// Clean up between tests by unregistering targets added during each test
const registeredIds: string[] = [];

beforeEach(() => {
  for (const id of registeredIds) {
    dropTargetRegistry.unregister(id);
  }
  registeredIds.length = 0;
});

describe('dropTargetRegistry — register / unregister', () => {
  it('adds a target and increments size', () => {
    const before = dropTargetRegistry.size;
    dropTargetRegistry.register({
      id: 'test-1', region: 'homedream', accepts: [], priority: 0, onDrop: vi.fn(),
    });
    registeredIds.push('test-1');
    expect(dropTargetRegistry.size).toBe(before + 1);
  });

  it('replaces a target on re-registration with same id', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    dropTargetRegistry.register({ id: 'test-2', region: 'homedream', accepts: [], priority: 0, onDrop: fn1 });
    dropTargetRegistry.register({ id: 'test-2', region: 'homedream', accepts: [], priority: 0, onDrop: fn2 });
    registeredIds.push('test-2');

    dropTargetRegistry.route(makeDrop(), 'homedream');
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it('unregister removes the target', () => {
    dropTargetRegistry.register({ id: 'test-3', region: 'homedream', accepts: [], priority: 0, onDrop: vi.fn() });
    const before = dropTargetRegistry.size;
    dropTargetRegistry.unregister('test-3');
    expect(dropTargetRegistry.size).toBe(before - 1);
  });
});

describe('dropTargetRegistry — route', () => {
  it('returns false when no target matches', () => {
    const result = dropTargetRegistry.route(makeDrop('url'), 'engin:lab');
    expect(result).toBe(false);
  });

  it('calls matching target onDrop', () => {
    const onDrop = vi.fn();
    dropTargetRegistry.register({ id: 'test-4', region: 'homedream', accepts: ['image'], priority: 0, onDrop });
    registeredIds.push('test-4');

    const result = dropTargetRegistry.route(makeDrop('image'), 'homedream');
    expect(result).toBe(true);
    expect(onDrop).toHaveBeenCalledOnce();
  });

  it('respects accepts filter — rejects non-matching type', () => {
    const onDrop = vi.fn();
    dropTargetRegistry.register({ id: 'test-5', region: 'homedream', accepts: ['video'], priority: 0, onDrop });
    registeredIds.push('test-5');

    const result = dropTargetRegistry.route(makeDrop('image'), 'homedream');
    expect(result).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('empty accepts array means accept all types', () => {
    const onDrop = vi.fn();
    dropTargetRegistry.register({ id: 'test-6', region: 'dreamspace', accepts: [], priority: 0, onDrop });
    registeredIds.push('test-6');

    const result = dropTargetRegistry.route(makeDrop('audio'), 'dreamspace');
    expect(result).toBe(true);
    expect(onDrop).toHaveBeenCalledOnce();
  });

  it('selects highest-priority matching target', () => {
    const lowFn  = vi.fn();
    const highFn = vi.fn();
    dropTargetRegistry.register({ id: 'test-7a', region: 'homedream', accepts: [], priority: 1,  onDrop: lowFn });
    dropTargetRegistry.register({ id: 'test-7b', region: 'homedream', accepts: [], priority: 10, onDrop: highFn });
    registeredIds.push('test-7a', 'test-7b');

    dropTargetRegistry.route(makeDrop('text/code'), 'homedream');
    expect(highFn).toHaveBeenCalledOnce();
    expect(lowFn).not.toHaveBeenCalled();
  });

  it('only routes to targets in the specified region', () => {
    const wrongFn = vi.fn();
    const rightFn = vi.fn();
    dropTargetRegistry.register({ id: 'test-8a', region: 'homedream',  accepts: [], priority: 0, onDrop: wrongFn });
    dropTargetRegistry.register({ id: 'test-8b', region: 'dreamspace', accepts: [], priority: 0, onDrop: rightFn });
    registeredIds.push('test-8a', 'test-8b');

    dropTargetRegistry.route(makeDrop(), 'dreamspace');
    expect(rightFn).toHaveBeenCalledOnce();
    expect(wrongFn).not.toHaveBeenCalled();
  });
});

describe('dropTargetRegistry — getTargetsForRegion', () => {
  it('returns only targets in the given region', () => {
    dropTargetRegistry.register({ id: 'test-9a', region: 'homedream',  accepts: [], priority: 0, onDrop: vi.fn() });
    dropTargetRegistry.register({ id: 'test-9b', region: 'dreamspace', accepts: [], priority: 0, onDrop: vi.fn() });
    registeredIds.push('test-9a', 'test-9b');

    const homeTargets = dropTargetRegistry.getTargetsForRegion('homedream');
    expect(homeTargets.some((t) => t.id === 'test-9a')).toBe(true);
    expect(homeTargets.some((t) => t.id === 'test-9b')).toBe(false);
  });
});
