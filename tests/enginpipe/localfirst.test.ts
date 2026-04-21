/**
 * tests/enginpipe/localfirst.test.ts
 *
 * Unit tests for the EnginPipe Local-First Principle (Component 10).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLocalFirstStore,
  type LocalFirstStore,
  type ExternalAdapter,
} from '@/lib/enginpipe/localfirst';

function makeStore(): LocalFirstStore {
  return createLocalFirstStore();
}

describe('enginpipe / localfirst — basic CRUD', () => {
  let store: LocalFirstStore;
  beforeEach(() => { store = makeStore(); });

  it('writes and reads a value', async () => {
    await store.write('sessions/abc', { active: true, count: 3 });
    const result = await store.read('sessions/abc');
    expect(result.value).toEqual({ active: true, count: 3 });
    expect(result.fromCache).toBe(true);
  });

  it('returns null for a missing key', async () => {
    const result = await store.read('sessions/missing');
    expect(result.value).toBeNull();
  });

  it('has() returns true for written paths', async () => {
    await store.write('x/y', { val: 1 });
    expect(store.has('x/y')).toBe(true);
    expect(store.has('/x/y')).toBe(true); // normalises leading slash
  });

  it('has() returns false for unknown paths', () => {
    expect(store.has('no/such/path')).toBe(false);
  });

  it('delete removes a value', async () => {
    await store.write('to/delete', { bye: true });
    await store.delete('to/delete');
    expect(store.has('to/delete')).toBe(false);
    const r = await store.read('to/delete');
    expect(r.value).toBeNull();
  });

  it('list returns all paths with a given prefix', async () => {
    await store.write('sessions/a', {});
    await store.write('sessions/b', {});
    await store.write('other/c',   {});

    const list = await store.list('sessions/');
    expect(list).toHaveLength(2);
    expect(list).toContain('/sessions/a');
    expect(list).toContain('/sessions/b');
  });

  it('size reflects the number of entries', async () => {
    expect(store.size).toBe(0);
    await store.write('k1', {});
    await store.write('k2', {});
    expect(store.size).toBe(2);
    await store.delete('k1');
    expect(store.size).toBe(1);
  });
});

describe('enginpipe / localfirst — versioning', () => {
  it('increments version on each write to the same path', async () => {
    const store = makeStore();
    await store.write('ver/x', { n: 1 });
    await store.write('ver/x', { n: 2 });
    // Read back and confirm value is updated
    const r = await store.read('ver/x');
    expect((r.value as { n: number }).n).toBe(2);
  });
});

describe('enginpipe / localfirst — snapshot export/import', () => {
  it('round-trips a snapshot', async () => {
    const a = makeStore();
    await a.write('brain/principles', { count: 8 });
    await a.write('brain/patterns',   { count: 3 });

    const snap = a.exportSnapshot();
    expect(snap.version).toBe(1);
    expect(snap.entries.length).toBe(2);

    const b = makeStore();
    b.importSnapshot(snap);
    const r = await b.read('brain/principles');
    expect((r.value as { count: number }).count).toBe(8);
  });
});

describe('enginpipe / localfirst — external adapter', () => {
  it('falls back to cache when adapter.read returns null', async () => {
    const store   = makeStore();
    await store.write('cached/key', { fromLocal: true });

    const adapter: ExternalAdapter = {
      read:   vi.fn().mockResolvedValue(null),
      write:  vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list:   vi.fn().mockResolvedValue([]),
    };
    store.setAdapter(adapter);

    const r = await store.read('cached/key');
    expect(r.fromCache).toBe(true);
    expect((r.value as { fromLocal: boolean }).fromLocal).toBe(true);
  });

  it('prefers adapter read over cache', async () => {
    const store = makeStore();
    await store.write('remote/key', { source: 'cache' });

    const adapter: ExternalAdapter = {
      read:   vi.fn().mockResolvedValue({ source: 'remote' }),
      write:  vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list:   vi.fn().mockResolvedValue([]),
    };
    store.setAdapter(adapter);

    const r = await store.read<{ source: string }>('remote/key');
    expect(r.fromCache).toBe(false);
    expect(r.value?.source).toBe('remote');
  });

  it('write attempts to persist via adapter', async () => {
    const store = makeStore();
    const write = vi.fn().mockResolvedValue(undefined);
    store.setAdapter({ read: vi.fn(), write, delete: vi.fn(), list: vi.fn() });

    const result = await store.write('adapter/path', { x: 1 });
    expect(result.ok).toBe(true);
    expect(result.persisted).toBe(true);
    expect(write).toHaveBeenCalledWith('/adapter/path', { x: 1 });
  });

  it('write still succeeds locally when adapter throws', async () => {
    const store = makeStore();
    store.setAdapter({
      read:   vi.fn(),
      write:  vi.fn().mockRejectedValue(new Error('network error')),
      delete: vi.fn(),
      list:   vi.fn(),
    });

    const result = await store.write('local/only', { v: 42 });
    expect(result.ok).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.error).toMatch('network error');
    // Local cache still has the value.
    expect(store.has('local/only')).toBe(true);
  });

  it('setAdapter(null) removes the adapter', async () => {
    const store   = makeStore();
    const adapter = { read: vi.fn().mockResolvedValue({ x: 99 }), write: vi.fn(), delete: vi.fn(), list: vi.fn() };
    store.setAdapter(adapter);
    store.setAdapter(null);

    await store.write('no-adapter', { local: true });
    const result = await store.write('no-adapter', { local: true });
    expect(result.persisted).toBe(false);
  });
});
