import { describe, expect, it } from 'vitest';

import {
  COLS,
  ROWS,
  FRAME_W,
  FRAME_H,
  ICONS,
  ICON_ENTRIES,
  getIconPos,
  hasIcon,
  type IconName,
} from '@/lib/icons/sheet';

// ─── Sheet constants ──────────────────────────────────────────────────────────

describe('sheet constants', () => {
  it('COLS and ROWS are positive integers', () => {
    expect(COLS).toBeGreaterThan(0);
    expect(ROWS).toBeGreaterThan(0);
    expect(Number.isInteger(COLS)).toBe(true);
    expect(Number.isInteger(ROWS)).toBe(true);
  });

  it('FRAME_W and FRAME_H are positive integers', () => {
    expect(FRAME_W).toBeGreaterThan(0);
    expect(FRAME_H).toBeGreaterThan(0);
    expect(Number.isInteger(FRAME_W)).toBe(true);
    expect(Number.isInteger(FRAME_H)).toBe(true);
  });
});

// ─── ICONS map bounds ─────────────────────────────────────────────────────────

describe('ICONS — every entry is within grid bounds', () => {
  const entries = ICON_ENTRIES;

  it('has at least one icon', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  for (const [name, { col, row }] of entries) {
    it(`"${name}" has col in [0, COLS-1] and row in [0, ROWS-1]`, () => {
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(COLS);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(ROWS);
    });
  }
});

// ─── No duplicate names ───────────────────────────────────────────────────────

describe('ICONS — no duplicate icon names', () => {
  it('all keys are unique (object guarantees this, but belt-and-braces)', () => {
    const keys = Object.keys(ICONS);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ─── getIconPos ───────────────────────────────────────────────────────────────

describe('getIconPos', () => {
  it('returns negative x/y offsets for non-zero positions', () => {
    const pos = getIconPos('twitter'); // col 1, row 0
    expect(pos.x).toBe(-(1 * FRAME_W));
    expect(pos.y).toEqual(0);
  });

  it('returns (0, 0) for the top-left icon', () => {
    const pos = getIconPos('facebook'); // col 0, row 0
    expect(pos.x).toEqual(0);
    expect(pos.y).toEqual(0);
  });

  it('computes correct offsets for an interior icon', () => {
    const { col, row } = ICONS['spotify']; // col 6, row 1
    const pos = getIconPos('spotify');
    expect(pos.x).toBe(-(col * FRAME_W));
    expect(pos.y).toBe(-(row * FRAME_H));
  });
});

// ─── hasIcon ─────────────────────────────────────────────────────────────────

describe('hasIcon', () => {
  it('returns true for registered icon names', () => {
    expect(hasIcon('facebook')).toBe(true);
    expect(hasIcon('trash')).toBe(true);
    expect(hasIcon('dot')).toBe(true);
  });

  it('returns false for unknown names', () => {
    expect(hasIcon('not-an-icon')).toBe(false);
    expect(hasIcon('')).toBe(false);
    expect(hasIcon('FACEBOOK')).toBe(false);
  });

  it('narrows type to IconName when true', () => {
    const name: string = 'spotify';
    if (hasIcon(name)) {
      // TypeScript should accept this without error
      const _check: IconName = name;
      expect(_check).toBe('spotify');
    }
  });
});

// ─── fallback "dot" icon ──────────────────────────────────────────────────────

describe('"dot" fallback icon', () => {
  it('is registered in ICONS', () => {
    expect(hasIcon('dot')).toBe(true);
  });

  it('is within bounds', () => {
    const { col, row } = ICONS['dot'];
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(COLS);
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(ROWS);
  });
});
