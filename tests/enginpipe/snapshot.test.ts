/**
 * tests/enginpipe/snapshot.test.ts
 *
 * Unit tests for the EnginPipe State Snapshot System (Component 5).
 */

import { describe, it, expect } from 'vitest';
import {
  createSnapshotManager,
  snapshotManager,
  type SnapshotValidationError,
} from '@/lib/enginpipe/snapshot';

describe('enginpipe / snapshot — write + load round-trip', () => {
  it('writes and loads a simple state', () => {
    const state = { score: 42, level: 'advanced', tags: ['a', 'b'] };
    const buf   = snapshotManager.writeSnapshot(state, 'engin:code');
    expect(buf).toBeInstanceOf(Uint8Array);

    const result = snapshotManager.loadSnapshot(buf);
    expect(result.meta.artifactId).toBe('engin:code');
    expect(result.state.score).toBe(42);
    expect(result.state.level).toBe('advanced');
  });

  it('preserves nested objects', () => {
    const state = { config: { fps: 60, tier: 'ultra', nested: { x: 1 } } };
    const buf   = snapshotManager.writeSnapshot(state, 'engin:games');
    const { state: out } = snapshotManager.loadSnapshot(buf);
    expect((out.config as { fps: number }).fps).toBe(60);
    expect((out.config as { nested: { x: number } }).nested.x).toBe(1);
  });

  it('getSnapshotSize matches actual buffer length', () => {
    const state = { data: 'hello world', count: 100 };
    const size  = snapshotManager.getSnapshotSize(state, 'test-artifact');
    const buf   = snapshotManager.writeSnapshot(state, 'test-artifact');
    expect(buf.byteLength).toBe(size);
  });

  it('meta.timestamp is close to Date.now()', () => {
    const before = Date.now();
    const buf    = snapshotManager.writeSnapshot({}, 'ts-test');
    const after  = Date.now();
    const { meta } = snapshotManager.loadSnapshot(buf);
    expect(meta.timestamp).toBeGreaterThanOrEqual(before);
    expect(meta.timestamp).toBeLessThanOrEqual(after + 10);
  });
});

describe('enginpipe / snapshot — validation', () => {
  it('validates a valid buffer', () => {
    const buf = snapshotManager.writeSnapshot({ ok: true }, 'v-test');
    expect(snapshotManager.validateSnapshot(buf)).toBeNull();
  });

  it('rejects a buffer that is too short', () => {
    const err = snapshotManager.validateSnapshot(new Uint8Array(5));
    expect(err).toBe('BUFFER_TOO_SHORT' satisfies SnapshotValidationError);
  });

  it('rejects a buffer with corrupted magic bytes', () => {
    const buf = snapshotManager.writeSnapshot({}, 'magic-test');
    const copy = new Uint8Array(buf);
    copy[0] = 0xff; // corrupt the magic
    expect(snapshotManager.validateSnapshot(copy)).toBe('INVALID_MAGIC' satisfies SnapshotValidationError);
  });

  it('rejects a buffer with a bad checksum', () => {
    const buf  = snapshotManager.writeSnapshot({ x: 1 }, 'crc-test');
    const copy = new Uint8Array(buf);
    copy[copy.length - 1] ^= 0xff; // flip the last byte of the CRC
    expect(snapshotManager.validateSnapshot(copy)).toBe('CHECKSUM_MISMATCH' satisfies SnapshotValidationError);
  });

  it('rejects a buffer with a mismatched schema version', () => {
    // Manager with version 2 cannot load a version 1 snapshot.
    const mgr2 = createSnapshotManager(2);
    const buf  = snapshotManager.writeSnapshot({}, 'ver-test'); // version 1
    expect(mgr2.validateSnapshot(buf)).toBe('SCHEMA_VERSION_MISMATCH' satisfies SnapshotValidationError);
  });

  it('loadSnapshot throws when buffer is invalid', () => {
    expect(() =>
      snapshotManager.loadSnapshot(new Uint8Array(4)),
    ).toThrow();
  });
});

describe('enginpipe / snapshot — idempotency', () => {
  it('multiple writes of the same state produce loadable buffers', () => {
    const state = { run: 1 };
    for (let i = 0; i < 5; i++) {
      const buf = snapshotManager.writeSnapshot(state, `iter-${i}`);
      const out = snapshotManager.loadSnapshot(buf);
      expect(out.state.run).toBe(1);
      expect(out.meta.artifactId).toBe(`iter-${i}`);
    }
  });
});
