/**
 * tests/engin-dispatcher.test.ts
 *
 * Unit tests for the DREAMengin execution layer:
 *   - lib/runtime/memory.ts       (SAB layout, workgroups, bounds guard)
 *   - lib/runtime/EnginDispatcher.ts (singleton, telemetry, seam, audit)
 *   - public/workers/engin-shader.worker.ts (source-level contract tests)
 *
 * All tests run in Node (vitest environment: 'node') — no DOM or real Workers.
 * Browser-only APIs (Worker, SharedArrayBuffer, performance.now) are shimmed
 * or conditionally skipped.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  ENTITY_COUNT,
  MAX_WORKERS,
  SAB_BYTES,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
  OFFSET_VEL_Z,
  OFFSET_DAYDREAM_TYPE,
  OFFSET_DREAMDM_BAR_Y,
  OFFSET_TELEMETRY,
  buildWorkgroups,
  isIndexInBounds,
  f32Channel,
  f32DreamDMBarY,
  f64Telemetry,
  u8DaydreamType,
  createEnginSAB,
} from '@/lib/runtime/memory';

import { EnginDispatcher } from '@/lib/runtime/EnginDispatcher';

const root = process.cwd();

// ─── SAB layout ───────────────────────────────────────────────────────────────

describe('EnginMemory — SAB layout constants', () => {
  it('ENTITY_COUNT is 10 000', () => {
    expect(ENTITY_COUNT).toBe(10_000);
  });

  it('MAX_WORKERS is 64', () => {
    expect(MAX_WORKERS).toBe(64);
  });

  it('SoA channels start at correct byte offsets', () => {
    const F = ENTITY_COUNT * 4; // 40 000 bytes per f32 channel
    expect(OFFSET_POS_X).toBe(0);
    expect(OFFSET_POS_Y).toBe(F);
    expect(OFFSET_POS_Z).toBe(F * 2);
    expect(OFFSET_VEL_X).toBe(F * 3);
    expect(OFFSET_VEL_Y).toBe(F * 4);
    expect(OFFSET_VEL_Z).toBe(F * 5);
  });

  it('DAYDREAM_TYPE follows immediately after VEL_Z', () => {
    expect(OFFSET_DAYDREAM_TYPE).toBe(OFFSET_VEL_Z + ENTITY_COUNT * 4);
  });

  it('DREAMDM_BAR_Y is 4-byte aligned and follows DAYDREAM_TYPE', () => {
    expect(OFFSET_DREAMDM_BAR_Y).toBe(250_000);
    expect(OFFSET_DREAMDM_BAR_Y % 4).toBe(0);
  });

  it('TELEMETRY zone is 8-byte aligned', () => {
    expect(OFFSET_TELEMETRY % 8).toBe(0);
    expect(OFFSET_TELEMETRY).toBe(250_008);
  });

  it('SAB_BYTES covers all zones without overlap', () => {
    const telemetryEnd = OFFSET_TELEMETRY + MAX_WORKERS * 8;
    expect(SAB_BYTES).toBe(telemetryEnd);
    // Verify no overlap between zones
    expect(OFFSET_DREAMDM_BAR_Y).toBeGreaterThan(OFFSET_DAYDREAM_TYPE);
    expect(OFFSET_TELEMETRY).toBeGreaterThan(OFFSET_DREAMDM_BAR_Y);
  });

  it('SAB_BYTES is divisible by 8 (guarantees Atomics alignment)', () => {
    expect(SAB_BYTES % 8).toBe(0);
  });
});

// ─── SAB factory ─────────────────────────────────────────────────────────────

describe('createEnginSAB', () => {
  it('creates a SharedArrayBuffer of exactly SAB_BYTES', () => {
    if (typeof SharedArrayBuffer === 'undefined') {
      // Node without --experimental-shared-memory
      console.warn('SharedArrayBuffer unavailable — skipping factory test');
      return;
    }
    const sab = createEnginSAB();
    expect(sab).toBeInstanceOf(SharedArrayBuffer);
    expect(sab.byteLength).toBe(SAB_BYTES);
  });

  it('all bytes are zero-initialised', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const sab = createEnginSAB();
    const view = new Uint8Array(sab);
    expect(view.every((b) => b === 0)).toBe(true);
  });
});

// ─── Typed-array view helpers ─────────────────────────────────────────────────

describe('SAB view helpers', () => {
  it('f32Channel returns Float32Array of length ENTITY_COUNT', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const sab = createEnginSAB();
    const ch = f32Channel(sab, OFFSET_POS_X);
    expect(ch).toBeInstanceOf(Float32Array);
    expect(ch.length).toBe(ENTITY_COUNT);
  });

  it('u8DaydreamType returns Uint8Array of length ENTITY_COUNT', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const sab = createEnginSAB();
    const ch = u8DaydreamType(sab);
    expect(ch).toBeInstanceOf(Uint8Array);
    expect(ch.length).toBe(ENTITY_COUNT);
  });

  it('f32DreamDMBarY returns Float32Array of length 1', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const sab = createEnginSAB();
    const v = f32DreamDMBarY(sab);
    expect(v).toBeInstanceOf(Float32Array);
    expect(v.length).toBe(1);
  });

  it('f64Telemetry returns Float64Array of length MAX_WORKERS', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const sab = createEnginSAB();
    const tel = f64Telemetry(sab);
    expect(tel).toBeInstanceOf(Float64Array);
    expect(tel.length).toBe(MAX_WORKERS);
  });

  it('POS_X and POS_Y views do not share bytes', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const sab = createEnginSAB();
    const px = f32Channel(sab, OFFSET_POS_X);
    const py = f32Channel(sab, OFFSET_POS_Y);
    px[0] = 42;
    expect(py[0]).toBe(0); // POS_Y should not see POS_X write
  });
});

// ─── Workgroup partitioning ───────────────────────────────────────────────────

describe('buildWorkgroups', () => {
  it('throws for workerCount < 1', () => {
    expect(() => buildWorkgroups(0)).toThrow();
    expect(() => buildWorkgroups(-1)).toThrow();
  });

  it('produces 1 workgroup covering all entities for workerCount=1', () => {
    const wgs = buildWorkgroups(1);
    expect(wgs.length).toBe(1);
    expect(wgs[0].startIndex).toBe(0);
    expect(wgs[0].endIndex).toBe(ENTITY_COUNT);
  });

  it('covers every entity exactly once for workerCount=4', () => {
    const wgs = buildWorkgroups(4);
    const indices = new Set<number>();
    for (const wg of wgs) {
      for (let i = wg.startIndex; i < wg.endIndex; i++) {
        expect(indices.has(i)).toBe(false); // no duplicates
        indices.add(i);
      }
    }
    expect(indices.size).toBe(ENTITY_COUNT);
  });

  it('covers every entity exactly once for workerCount=7 (odd, with remainder)', () => {
    const wgs = buildWorkgroups(7);
    let total = 0;
    for (const wg of wgs) {
      total += wg.endIndex - wg.startIndex;
    }
    expect(total).toBe(ENTITY_COUNT);
  });

  it('assigns sequential, non-overlapping ranges', () => {
    const wgs = buildWorkgroups(4);
    for (let i = 1; i < wgs.length; i++) {
      expect(wgs[i].startIndex).toBe(wgs[i - 1].endIndex);
    }
    expect(wgs[0].startIndex).toBe(0);
    expect(wgs[wgs.length - 1].endIndex).toBe(ENTITY_COUNT);
  });

  it('clamps to MAX_WORKERS when workerCount exceeds limit', () => {
    const wgs = buildWorkgroups(MAX_WORKERS + 10);
    expect(wgs.length).toBe(MAX_WORKERS);
  });

  it('assigns correct workerIndex to each group', () => {
    const wgs = buildWorkgroups(4);
    wgs.forEach((wg, i) => {
      expect(wg.workerIndex).toBe(i);
    });
  });
});

// ─── Bounds guard ─────────────────────────────────────────────────────────────

describe('isIndexInBounds', () => {
  const wg = { workerIndex: 1, startIndex: 2500, endIndex: 5000 };

  it('returns true for startIndex', () => {
    expect(isIndexInBounds(2500, wg)).toBe(true);
  });

  it('returns true for endIndex - 1', () => {
    expect(isIndexInBounds(4999, wg)).toBe(true);
  });

  it('returns true for a mid-range index', () => {
    expect(isIndexInBounds(3750, wg)).toBe(true);
  });

  it('returns false for index below startIndex', () => {
    expect(isIndexInBounds(2499, wg)).toBe(false);
  });

  it('returns false for endIndex (exclusive upper bound)', () => {
    expect(isIndexInBounds(5000, wg)).toBe(false);
  });

  it('returns false for index far outside range', () => {
    expect(isIndexInBounds(0, wg)).toBe(false);
    expect(isIndexInBounds(9999, wg)).toBe(false);
  });
});

// ─── EnginDispatcher singleton ────────────────────────────────────────────────

describe('EnginDispatcher singleton', () => {
  beforeEach(() => {
    EnginDispatcher._resetForTesting();
  });

  afterEach(() => {
    EnginDispatcher._resetForTesting();
  });

  it('returns the same instance on repeated calls', () => {
    const a = EnginDispatcher.getInstance();
    const b = EnginDispatcher.getInstance();
    expect(a).toBe(b);
  });

  it('starts uninitialised', () => {
    const d = EnginDispatcher.getInstance();
    expect(d.initialized).toBe(false);
  });

  it('init() is a no-op in Node (no Worker global)', () => {
    const d = EnginDispatcher.getInstance();
    // Worker is not defined in Node — init should not throw
    expect(() => d.init()).not.toThrow();
  });

  it('init() is a no-op when SharedArrayBuffer is unavailable', () => {
    vi.stubGlobal('Worker', class MockWorker {
      onmessage: ((evt: MessageEvent) => void) | null = null;
      onerror: ((err: ErrorEvent) => void) | null = null;
      postMessage(): void {}
      terminate(): void {}
    });
    vi.stubGlobal('SharedArrayBuffer', undefined);

    try {
      const d = EnginDispatcher.getInstance();
      expect(() => d.init()).not.toThrow();
      expect(d.initialized).toBe(false);
      expect(d.sab).toBeNull();
      expect(d.workgroups.length).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('stats returns zero workers and empty telemetry before init', () => {
    const d = EnginDispatcher.getInstance();
    const s = d.stats;
    expect(s.workerCount).toBe(0);
    expect(s.microsecondsPerTick.length).toBe(0);
    expect(s.boundsViolations).toBe(0);
  });

  it('sab is null before init', () => {
    const d = EnginDispatcher.getInstance();
    expect(d.sab).toBeNull();
  });

  it('workgroups is empty before init', () => {
    const d = EnginDispatcher.getInstance();
    expect(d.workgroups.length).toBe(0);
  });

  it('dispose() is safe to call on uninitialised dispatcher', () => {
    const d = EnginDispatcher.getInstance();
    expect(() => d.dispose()).not.toThrow();
  });
});

// ─── Dual-Runtime Seam — DreamDM Bar y-offset ────────────────────────────────

describe('EnginDispatcher — Dual-Runtime Seam (DreamDM Bar y-offset)', () => {
  afterEach(() => {
    EnginDispatcher._resetForTesting();
  });

  it('setDreamDMBarY / getDreamDMBarY round-trip when SAB is available', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;

    const d = EnginDispatcher.getInstance();
    // Manually inject a SAB to test the seam without spawning workers
    // Access private field via type cast for testing purposes
    (d as unknown as { _sab: SharedArrayBuffer })._sab = createEnginSAB();

    d.setDreamDMBarY(128.5);
    expect(d.getDreamDMBarY()).toBeCloseTo(128.5, 2);
  });

  it('setDreamDMBarY is a no-op when sab is null', () => {
    const d = EnginDispatcher.getInstance();
    expect(() => d.setDreamDMBarY(100)).not.toThrow();
    expect(d.getDreamDMBarY()).toBe(0);
  });

  it('getDreamDMBarY returns 0 when sab is null', () => {
    const d = EnginDispatcher.getInstance();
    expect(d.getDreamDMBarY()).toBe(0);
  });
});

// ─── Elite-Runtime Telemetry ──────────────────────────────────────────────────

describe('EnginDispatcher — Elite-Runtime Telemetry', () => {
  afterEach(() => {
    EnginDispatcher._resetForTesting();
  });

  it('reads µs/tick from SAB telemetry zone', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;

    const d = EnginDispatcher.getInstance();
    const sab = createEnginSAB();
    (d as unknown as { _sab: SharedArrayBuffer })._sab = sab;
    // Simulate 2 workers
    (d as unknown as { _workers: unknown[] })._workers = [null, null];

    // Write synthetic telemetry values into the SAB
    const tel = f64Telemetry(sab);
    tel[0] = 250;   // worker 0: 250 µs/tick
    tel[1] = 1_800; // worker 1: 1800 µs/tick

    const stats = d.stats;
    expect(stats.workerCount).toBe(2);
    expect(stats.microsecondsPerTick[0]).toBe(250);
    expect(stats.microsecondsPerTick[1]).toBe(1_800);
  });
});

// ─── Worker source-level contract ────────────────────────────────────────────

describe('engin-shader.worker.ts — source contract', () => {
  const workerSrc = readFileSync(
    join(root, 'public/workers/engin-shader.worker.ts'),
    'utf-8',
  );

  it('file exists and is non-empty', () => {
    expect(workerSrc.length).toBeGreaterThan(0);
  });

  it('handles init message', () => {
    expect(workerSrc).toContain("case 'init'");
  });

  it('handles stop message', () => {
    expect(workerSrc).toContain("case 'stop'");
  });

  it('reads DreamDM Bar y-offset (Dual-Runtime Seam)', () => {
    expect(workerSrc).toContain('OFFSET_DREAMDM_BAR_Y');
    expect(workerSrc).toContain('barY[0]');
  });

  it('applies Wasm SIMD f32x4.add velocity integration', () => {
    expect(workerSrc).toContain('wasmSIMDAddF32x4');
    expect(workerSrc).toContain('f32x4');
  });

  it('writes µs/tick into SAB Telemetry Zone', () => {
    expect(workerSrc).toContain('OFFSET_TELEMETRY');
    expect(workerSrc).toContain('telemetry[workerIndex]');
    expect(workerSrc).toContain('microsecondsPerTick');
  });

  it('posts tick message to dispatcher with telemetry', () => {
    expect(workerSrc).toContain("type: 'tick'");
    expect(workerSrc).toContain('workerIndex');
  });

  it('performs IDARi/TheBoogieMan bounds audit (assertInBounds)', () => {
    expect(workerSrc).toContain('assertInBounds');
    expect(workerSrc).toContain("type: 'bounds_violation'");
  });

  it('uses requestAnimationFrame loop', () => {
    expect(workerSrc).toContain('requestAnimationFrame');
    expect(workerSrc).toContain('rafLoop');
  });

  it('has a setTimeout fallback for non-browser environments', () => {
    expect(workerSrc).toContain('setTimeout');
  });

  it('processes entities in SIMD lane width of 4', () => {
    expect(workerSrc).toContain('i + 4 <= end');
  });

  it('mirror constants match lib/runtime/memory.ts values', () => {
    // Verify the worker's local constants are in sync with memory.ts
    expect(workerSrc).toContain('const ENTITY_COUNT      = 10_000');
    expect(workerSrc).toContain('const OFFSET_DREAMDM_BAR_Y = 250_000');
    expect(workerSrc).toContain('const OFFSET_TELEMETRY    = 250_008');
  });
});

// ─── IDARi/TheBoogieMan audit integrity ───────────────────────────────────────

describe('Audit — no worker writes outside assigned range', () => {
  it('workgroups from buildWorkgroups have non-overlapping ranges', () => {
    for (const count of [1, 2, 4, 7, 16]) {
      const wgs = buildWorkgroups(count);
      const seen = new Set<number>();
      for (const wg of wgs) {
        for (let i = wg.startIndex; i < wg.endIndex; i++) {
          expect(seen.has(i)).toBe(false);
          seen.add(i);
        }
      }
      expect(seen.size).toBe(ENTITY_COUNT);
    }
  });

  it('isIndexInBounds rejects indices belonging to a different worker', () => {
    const wgs = buildWorkgroups(4);
    // Worker 0's range should reject an index from worker 2's range
    const wg0 = wgs[0];
    const wg2 = wgs[2];
    const midWg2 = Math.floor((wg2.startIndex + wg2.endIndex) / 2);
    expect(isIndexInBounds(midWg2, wg0)).toBe(false);
  });

  it('dispatcher stats tracks boundsViolations counter', () => {
    EnginDispatcher._resetForTesting();
    const d = EnginDispatcher.getInstance();
    expect(d.stats.boundsViolations).toBe(0);
    EnginDispatcher._resetForTesting();
  });

  it('EnginDispatcher source contains audit logging for bounds violations', () => {
    const src = readFileSync(
      join(root, 'lib/runtime/EnginDispatcher.ts'),
      'utf-8',
    );
    expect(src).toContain("case 'bounds_violation'");
    expect(src).toContain('_boundsViolations');
    expect(src).toContain('AUDIT');
  });
});
