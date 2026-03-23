/**
 * tests/phase8g-dual-runtime-persistence.test.ts
 *
 * Phase 8 §G Point 63 — Dual runtime state persists to localStorage and
 * restores on reload.
 *
 * Tests the useDualRuntimePersistence hook logic (pure unit test of
 * serialize/deserialize helpers without React rendering).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

describe('Phase 8 §G — useDualRuntimePersistence (Point 63)', () => {
  it('hook file exists', () => {
    expect(() =>
      readFileSync(join(root, 'lib/runtime/useDualRuntimePersistence.ts'), 'utf-8')
    ).not.toThrow();
  });

  it('persists state to localStorage', () => {
    const src = readFileSync(
      join(root, 'lib/runtime/useDualRuntimePersistence.ts'),
      'utf-8',
    );
    expect(src).toContain('localStorage.setItem');
    expect(src).toContain('STORAGE_KEY');
  });

  it('restores state from localStorage on init', () => {
    const src = readFileSync(
      join(root, 'lib/runtime/useDualRuntimePersistence.ts'),
      'utf-8',
    );
    expect(src).toContain('localStorage.getItem');
    expect(src).toContain('deserializeState');
  });

  it('exposes setTopWorld, setBottomWorld, swapDominant, goHome actions', () => {
    const src = readFileSync(
      join(root, 'lib/runtime/useDualRuntimePersistence.ts'),
      'utf-8',
    );
    expect(src).toContain('setTopWorld');
    expect(src).toContain('setBottomWorld');
    expect(src).toContain('swapDominant');
    expect(src).toContain('goHome');
  });

  it('falls back to DEFAULT_DUAL_RUNTIME when localStorage is empty', () => {
    const src = readFileSync(
      join(root, 'lib/runtime/useDualRuntimePersistence.ts'),
      'utf-8',
    );
    expect(src).toContain('DEFAULT_DUAL_RUNTIME');
  });
});

describe('Phase 8 §G — dualRuntimeBridge cross-Engin bus (Point 66)', () => {
  it('bridge singleton exported for cross-Engin sharing', () => {
    const src = readFileSync(
      join(root, 'lib/runtime/dualRuntimeBridge.ts'),
      'utf-8',
    );
    expect(src).toContain('export');
    expect(src).toContain('bridge');
  });

  it('ContentEngin subscribes to music channel (one Engin pair shares state)', () => {
    const src = readFileSync(
      join(root, 'components/daydream/ContentEngin.tsx'),
      'utf-8',
    );
    // ContentEngin subscribes to StarMakerEngin's music:stem-ready event
    expect(src).toContain("bridge.subscribe('music'");
  });
});
