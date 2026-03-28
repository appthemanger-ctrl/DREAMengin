import { describe, expect, it } from 'vitest';

import {
  COMPACT_RUNTIME_VIEWPORT_MAX_WIDTH,
  getPreferredViewportHeight,
  isCompactRuntimeViewport,
} from '@/lib/ui/runtimeViewport';

describe('isCompactRuntimeViewport', () => {
  it('treats widths below the mobile cutoff as compact', () => {
    expect(isCompactRuntimeViewport(COMPACT_RUNTIME_VIEWPORT_MAX_WIDTH - 1)).toBe(true);
  });

  it('treats the cutoff width and larger widths as non-compact', () => {
    expect(isCompactRuntimeViewport(COMPACT_RUNTIME_VIEWPORT_MAX_WIDTH)).toBe(false);
    expect(isCompactRuntimeViewport(1024)).toBe(false);
  });
});

describe('getPreferredViewportHeight', () => {
  it('uses the smaller visual viewport height when the keyboard shrinks the viewport', () => {
    expect(getPreferredViewportHeight(852, 604)).toBe(604);
  });

  it('falls back to innerHeight when the visual viewport height is missing or invalid', () => {
    expect(getPreferredViewportHeight(852, undefined)).toBe(852);
    expect(getPreferredViewportHeight(852, null)).toBe(852);
    expect(getPreferredViewportHeight(852, Number.NaN)).toBe(852);
    expect(getPreferredViewportHeight(852, 0)).toBe(852);
  });

  it('never grows beyond innerHeight even if visualViewport reports a larger size', () => {
    expect(getPreferredViewportHeight(852, 900)).toBe(852);
  });
});
