import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  DAYDREAM_PAIR_SYSTEM,
  DAYDREAM_ENGIN_SIDE_MENU_CONTROL,
  DAYDREAM_TO_ENGIN,
  DAYDREAM_DOMAINS,
  ENGIN_SURFACES,
} from '@/lib/identity/canonical-names';

describe('README §9 Daydream Pair System', () => {
  it('defines exactly 6 canonical Side A ↔ Side B pairs', () => {
    expect(DAYDREAM_PAIR_SYSTEM).toHaveLength(6);
  });

  it('matches the canonical Daydream → Engin mapping', () => {
    const daydreamToEnginRecord = Object.fromEntries(
      DAYDREAM_PAIR_SYSTEM.map((pair) => [pair.daydreamDomain, pair.enginSurface]),
    );
    expect(daydreamToEnginRecord).toEqual(DAYDREAM_TO_ENGIN);
  });

  it('includes specialized tools and Dream Window support on every pair', () => {
    for (const pair of DAYDREAM_PAIR_SYSTEM) {
      expect(pair.specializedTools).toBe(true);
      expect(pair.specializedDreamWindowSupport).toBe(true);
    }
  });

  it('uses the canonical dual-button control pill contract for engin side menus', () => {
    expect(DAYDREAM_ENGIN_SIDE_MENU_CONTROL).toBe('dual-button-pill');
  });

  it('uses only canonical Daydream and Engin names', () => {
    const validDaydreams = new Set(Object.values(DAYDREAM_DOMAINS));
    const validEngins = new Set(Object.values(ENGIN_SURFACES));

    for (const pair of DAYDREAM_PAIR_SYSTEM) {
      expect(validDaydreams.has(pair.daydreamDomain)).toBe(true);
      expect(validEngins.has(pair.enginSurface)).toBe(true);
    }
  });

  it('DaydreamShell includes the small separate dual-button Engin control pill', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/daydream/DaydreamShell.tsx'),
      'utf-8',
    );

    expect(source).toContain('function EnginPillControls');
    expect(source).toContain('aria-label="Return to Side A"');
    expect(source).toContain('aria-label={`${enginName} engine controls`}');
  });
});
