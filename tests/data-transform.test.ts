import { describe, expect, it } from 'vitest';

import {
  applyPhysicsFilter,
  DATA_PHYSICS,
  decodeFromLedger,
  encodeToLedger,
} from '@/lib/data-transform';

describe('data-transform', () => {
  it('round-trips values through the ledger transform', () => {
    const source = [-10, -1, -0.25, 0, 0.25, 1, 10];

    const encoded = encodeToLedger(source);
    const decoded = decodeFromLedger(encoded);

    expect(encoded).not.toBe(source);
    decoded.forEach((value, index) => {
      expect(value).toBeCloseTo(source[index], 12);
    });
  });

  it('filters low-participation values using the configured threshold', () => {
    expect(applyPhysicsFilter([0, 1, 0.5, -1])).toEqual([0.5, -1]);
  });

  it('exports the enhanced physics constants', () => {
    expect(DATA_PHYSICS).toEqual({
      n: 2.1,
      a0: 1.2e-10,
      participation: 0.1,
    });
  });
});
