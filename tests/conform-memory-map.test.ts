/**
 * tests/conform-memory-map.test.ts
 *
 * Unit tests for the DREAMengin Shared Memory Map (Conform Mode).
 * Validates lib/runtime/memory.ts:
 *   - 16 MB SharedArrayBuffer allocation
 *   - 64-byte cache-line alignment of all SoA array offsets
 *   - SoA layout (PosX, PosY, VelX, VelY) for 10,000 entities
 *   - DreamDM Bar Seam Logic (writeBarSeam / readBarSeam via Atomics)
 *   - TheBoogieMan.Ai memory policy guard (HomeDream private region protection)
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  MEMORY_SIZE,
  CACHE_LINE,
  ENTITY_COUNT,
  BAR_SEAM_ATOMICS_INDEX,
  BAR_SEAM_SCALE,
  SOA_POSX_OFFSET,
  SOA_POSY_OFFSET,
  SOA_VELX_OFFSET,
  SOA_VELY_OFFSET,
  HOMEDREAM_PRIVATE_OFFSET,
  PUBLIC_VIEW_LIMIT,
  getConformMemoryMap,
  _resetConformMemoryMap,
  writeBarSeam,
  readBarSeam,
  boogieMemoryGuard,
} from '@/lib/runtime/memory';

beforeEach(() => {
  _resetConformMemoryMap();
});

// ── Buffer sizing and alignment ───────────────────────────────────────────────

describe('Conform Mode — SharedArrayBuffer allocation', () => {
  it('allocates exactly 16 MB', () => {
    expect(MEMORY_SIZE).toBe(16 * 1024 * 1024);
  });

  it('allocates a SharedArrayBuffer of the correct size', () => {
    const map = getConformMemoryMap();
    expect(map.buffer).toBeInstanceOf(SharedArrayBuffer);
    expect(map.buffer.byteLength).toBe(MEMORY_SIZE);
  });

  it('returns the same singleton on repeated calls', () => {
    const a = getConformMemoryMap();
    const b = getConformMemoryMap();
    expect(a.buffer).toBe(b.buffer);
  });

  it('allocates a new buffer after _resetConformMemoryMap', () => {
    const a = getConformMemoryMap();
    _resetConformMemoryMap();
    const b = getConformMemoryMap();
    expect(a.buffer).not.toBe(b.buffer);
  });
});

// ── Cache-line alignment ──────────────────────────────────────────────────────

describe('SoA array offsets — 64-byte cache-line alignment', () => {
  it('CACHE_LINE is 64 bytes', () => {
    expect(CACHE_LINE).toBe(64);
  });

  it('PosX starts at offset 64 (one cache line into the buffer)', () => {
    expect(SOA_POSX_OFFSET).toBe(64);
    expect(SOA_POSX_OFFSET % CACHE_LINE).toBe(0);
  });

  it('PosY offset is 64-byte aligned', () => {
    expect(SOA_POSY_OFFSET % CACHE_LINE).toBe(0);
  });

  it('VelX offset is 64-byte aligned', () => {
    expect(SOA_VELX_OFFSET % CACHE_LINE).toBe(0);
  });

  it('VelY offset is 64-byte aligned', () => {
    expect(SOA_VELY_OFFSET % CACHE_LINE).toBe(0);
  });

  it('HOMEDREAM_PRIVATE_OFFSET is 64-byte aligned', () => {
    expect(HOMEDREAM_PRIVATE_OFFSET % CACHE_LINE).toBe(0);
  });
});

// ── SoA layout for 10,000 entities ───────────────────────────────────────────

describe('Conform Mode — SoA entity layout', () => {
  it('ENTITY_COUNT is 10,000', () => {
    expect(ENTITY_COUNT).toBe(10_000);
  });

  it('each SoA array has length ENTITY_COUNT', () => {
    const map = getConformMemoryMap();
    expect(map.posX.length).toBe(ENTITY_COUNT);
    expect(map.posY.length).toBe(ENTITY_COUNT);
    expect(map.velX.length).toBe(ENTITY_COUNT);
    expect(map.velY.length).toBe(ENTITY_COUNT);
  });

  it('SoA arrays are Float32Array views', () => {
    const map = getConformMemoryMap();
    expect(map.posX).toBeInstanceOf(Float32Array);
    expect(map.posY).toBeInstanceOf(Float32Array);
    expect(map.velX).toBeInstanceOf(Float32Array);
    expect(map.velY).toBeInstanceOf(Float32Array);
  });

  it('SoA arrays point to non-overlapping regions', () => {
    // Each array occupies ENTITY_COUNT * 4 bytes; verify their byte offsets are sequential
    expect(SOA_POSY_OFFSET).toBe(SOA_POSX_OFFSET + ENTITY_COUNT * 4);
    expect(SOA_VELX_OFFSET).toBe(SOA_POSY_OFFSET + ENTITY_COUNT * 4);
    expect(SOA_VELY_OFFSET).toBe(SOA_VELX_OFFSET + ENTITY_COUNT * 4);
  });

  it('writes and reads entity data correctly', () => {
    const map = getConformMemoryMap();
    map.posX[0] = 1.5;
    map.posY[0] = 2.5;
    map.velX[0] = -0.5;
    map.velY[0] = 0.25;

    expect(map.posX[0]).toBeCloseTo(1.5);
    expect(map.posY[0]).toBeCloseTo(2.5);
    expect(map.velX[0]).toBeCloseTo(-0.5);
    expect(map.velY[0]).toBeCloseTo(0.25);
  });

  it('writes to the last entity slot without overflow', () => {
    const map = getConformMemoryMap();
    map.posX[ENTITY_COUNT - 1] = 9999.0;
    expect(map.posX[ENTITY_COUNT - 1]).toBeCloseTo(9999.0);
  });
});

// ── Control region ────────────────────────────────────────────────────────────

describe('Conform Mode — control region', () => {
  it('control view is an Int32Array', () => {
    const map = getConformMemoryMap();
    expect(map.control).toBeInstanceOf(Int32Array);
  });

  it('control view has 16 slots (64 bytes / 4 bytes per Int32)', () => {
    const map = getConformMemoryMap();
    expect(map.control.length).toBe(CACHE_LINE / 4);
  });

  it('BAR_SEAM_ATOMICS_INDEX is within the control region', () => {
    expect(BAR_SEAM_ATOMICS_INDEX).toBeGreaterThanOrEqual(0);
    expect(BAR_SEAM_ATOMICS_INDEX).toBeLessThan(CACHE_LINE / 4);
  });
});

// ── DreamDM Bar Seam Logic ────────────────────────────────────────────────────

describe('DreamDM Bar Seam Logic — writeBarSeam / readBarSeam', () => {
  it('writes 0.9 (Surface-focus) and reads it back', () => {
    writeBarSeam(0.9);
    expect(readBarSeam()).toBeCloseTo(0.9, 3);
  });

  it('writes 0.5 (balanced) and reads it back', () => {
    writeBarSeam(0.5);
    expect(readBarSeam()).toBeCloseTo(0.5, 3);
  });

  it('writes 0.1 (Dream-focus) and reads it back', () => {
    writeBarSeam(0.1);
    expect(readBarSeam()).toBeCloseTo(0.1, 3);
  });

  it('writes 1.0 (Surface-only) and reads it back', () => {
    writeBarSeam(1.0);
    expect(readBarSeam()).toBeCloseTo(1.0, 3);
  });

  it('defaults to 0.0 before any write', () => {
    // SharedArrayBuffer is zero-initialized
    expect(readBarSeam()).toBe(0);
  });

  it('stores the value at BAR_SEAM_ATOMICS_INDEX using Atomics', () => {
    writeBarSeam(0.75);
    const map = getConformMemoryMap();
    const raw = Atomics.load(map.control, BAR_SEAM_ATOMICS_INDEX);
    expect(raw).toBe(Math.round(0.75 * BAR_SEAM_SCALE));
  });

  it('BAR_SEAM_SCALE is 1000', () => {
    expect(BAR_SEAM_SCALE).toBe(1_000);
  });

  it('overwrites the previous value on repeated writes', () => {
    writeBarSeam(0.9);
    writeBarSeam(0.1);
    expect(readBarSeam()).toBeCloseTo(0.1, 3);
  });
});

// ── TheBoogieMan.Ai policy guard ──────────────────────────────────────────────

describe('boogieMemoryGuard — HomeDream private region protection', () => {
  it('allows access at offset 0 for any consumer', () => {
    expect(boogieMemoryGuard(0, false).allowed).toBe(true);
    expect(boogieMemoryGuard(0, false).ruleCode).toBe('OK');
  });

  it('allows access anywhere in the public view region for any consumer', () => {
    const result = boogieMemoryGuard(PUBLIC_VIEW_LIMIT - 1, false);
    expect(result.allowed).toBe(true);
    expect(result.ruleCode).toBe('OK');
  });

  it('PUBLIC_VIEW_LIMIT equals HOMEDREAM_PRIVATE_OFFSET', () => {
    expect(PUBLIC_VIEW_LIMIT).toBe(HOMEDREAM_PRIVATE_OFFSET);
  });

  it('HOMEDREAM_PRIVATE_OFFSET is beyond all SoA data', () => {
    const soaEndOffset = SOA_VELY_OFFSET + ENTITY_COUNT * 4; // 160,064
    expect(HOMEDREAM_PRIVATE_OFFSET).toBeGreaterThanOrEqual(soaEndOffset);
  });

  it('denies non-owner access to the HomeDream private region with C29_PRIVACY', () => {
    const result = boogieMemoryGuard(HOMEDREAM_PRIVATE_OFFSET, false);
    expect(result.allowed).toBe(false);
    expect(result.ruleCode).toBe('C29_PRIVACY');
    expect(result.reason).toBeDefined();
  });

  it('denies non-owner access deep inside the private region', () => {
    const result = boogieMemoryGuard(HOMEDREAM_PRIVATE_OFFSET + 1024, false);
    expect(result.allowed).toBe(false);
    expect(result.ruleCode).toBe('C29_PRIVACY');
  });

  it('allows owner access to the HomeDream private region', () => {
    const result = boogieMemoryGuard(HOMEDREAM_PRIVATE_OFFSET, true);
    expect(result.allowed).toBe(true);
    expect(result.ruleCode).toBe('OK');
  });

  it('allows owner access deep inside the private region', () => {
    const result = boogieMemoryGuard(MEMORY_SIZE - 1, true);
    expect(result.allowed).toBe(true);
    expect(result.ruleCode).toBe('OK');
  });

  it('denies access at negative offsets unconditionally', () => {
    const result = boogieMemoryGuard(-1, true);
    expect(result.allowed).toBe(false);
    expect(result.ruleCode).toBe('MEM_PRIVATE_ACCESS');
  });

  it('denies access at or beyond MEMORY_SIZE unconditionally', () => {
    const result = boogieMemoryGuard(MEMORY_SIZE, true);
    expect(result.allowed).toBe(false);
    expect(result.ruleCode).toBe('MEM_PRIVATE_ACCESS');
  });

  it('denial reason mentions the private region start offset', () => {
    const result = boogieMemoryGuard(HOMEDREAM_PRIVATE_OFFSET, false);
    expect(result.reason).toContain(String(HOMEDREAM_PRIVATE_OFFSET));
    expect(result.reason).toContain(String(PUBLIC_VIEW_LIMIT));
  });
});
