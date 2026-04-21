/**
 * tests/enginpipe/compression.test.ts
 *
 * Unit tests for the EnginPipe Asset Compression Standards (Component 9).
 */

import { describe, it, expect } from 'vitest';
import {
  COMPRESSION_POLICY,
  selectFormat,
  validateFormat,
  checkSizeBudget,
  type AssetClass,
} from '@/lib/enginpipe/compression';

const ALL_CLASSES: AssetClass[] = [
  'image-raster',
  'image-vector',
  'audio',
  'geometry-3d',
  'data',
  'video',
];

describe('enginpipe / compression — COMPRESSION_POLICY', () => {
  it('defines an entry for every asset class', () => {
    for (const cls of ALL_CLASSES) {
      expect(COMPRESSION_POLICY[cls]).toBeDefined();
    }
  });

  it('each policy entry has a non-empty preferred format', () => {
    for (const cls of ALL_CLASSES) {
      expect(COMPRESSION_POLICY[cls].preferred).toBeTruthy();
    }
  });

  it('image-raster preferred is avif', () => {
    expect(COMPRESSION_POLICY['image-raster'].preferred).toBe('avif');
  });

  it('audio preferred is opus', () => {
    expect(COMPRESSION_POLICY['audio'].preferred).toBe('opus');
  });

  it('geometry-3d preferred is draco', () => {
    expect(COMPRESSION_POLICY['geometry-3d'].preferred).toBe('draco');
  });

  it('data preferred is zstd', () => {
    expect(COMPRESSION_POLICY['data'].preferred).toBe('zstd');
  });

  it('all compression ratios are between 0 and 1', () => {
    for (const cls of ALL_CLASSES) {
      const ratio = COMPRESSION_POLICY[cls].compressionRatioHint;
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThanOrEqual(1);
    }
  });
});

describe('enginpipe / compression — selectFormat', () => {
  it('returns the preferred format by default', () => {
    const fmt = selectFormat({ assetClass: 'image-raster' });
    expect(fmt.preferred).toBe('avif');
  });

  it('returns the fallback format when useFallback=true', () => {
    const fmt = selectFormat({ assetClass: 'image-raster' }, true);
    expect(fmt.preferred).toBe('webp');
  });

  it('returns preferred even when useFallback=true and no fallback defined', () => {
    // image-vector has no fallback
    const fmt = selectFormat({ assetClass: 'image-vector' }, true);
    expect(fmt.preferred).toBe('svg+xml');
  });
});

describe('enginpipe / compression — validateFormat', () => {
  it('accepts the preferred format', () => {
    const result = validateFormat({ assetClass: 'audio' }, 'opus');
    expect(result.compliant).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('accepts the fallback format', () => {
    const result = validateFormat({ assetClass: 'audio' }, 'aac');
    expect(result.compliant).toBe(true);
  });

  it('accepts format with a leading dot (normalises it)', () => {
    const result = validateFormat({ assetClass: 'geometry-3d' }, '.glb');
    expect(result.compliant).toBe(true);
  });

  it('rejects a wrong format', () => {
    const result = validateFormat({ assetClass: 'image-raster' }, 'jpeg');
    expect(result.compliant).toBe(false);
    expect(result.reason).toBe('wrong_format');
    expect(result.expected.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    const result = validateFormat({ assetClass: 'data' }, 'ZSTD');
    expect(result.compliant).toBe(true);
  });
});

describe('enginpipe / compression — checkSizeBudget', () => {
  it('reports within budget for small assets', () => {
    // Audio at 12% ratio: 100KB raw → ~12KB compressed
    const result = checkSizeBudget(
      { assetClass: 'audio', sizeBytes: 100_000 },
      20_000,
    );
    expect(result.withinBudget).toBe(true);
    expect(result.estimatedCompressedBytes).toBeLessThanOrEqual(20_000);
  });

  it('reports out of budget for large assets', () => {
    // Image at 40% ratio: 10MB raw → ~4MB compressed
    const result = checkSizeBudget(
      { assetClass: 'image-raster', sizeBytes: 10_000_000 },
      1_000_000,
    );
    expect(result.withinBudget).toBe(false);
    expect(result.estimatedCompressedBytes).toBeGreaterThan(1_000_000);
  });

  it('returns 0 estimated bytes when sizeBytes is omitted', () => {
    const result = checkSizeBudget({ assetClass: 'data' }, 1_000);
    expect(result.estimatedCompressedBytes).toBe(0);
    expect(result.withinBudget).toBe(true);
  });
});
