import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DIVIDER_H } from '@/lib/dreamdm/barInteractions';

describe('HomeDream home surface', () => {
  const dashboard = readFileSync(
    resolve(__dirname, '../components/home/WorkspaceDashboard.tsx'),
    'utf8',
  );

  it('keeps HomeDream feed-first and removes the extra home search surface', () => {
    expect(dashboard).toContain('HomeDream Feed');
    expect(dashboard).not.toContain('DrEamsSearchBar');
    expect(dashboard).not.toContain('Recent Activity');
    expect(dashboard).not.toContain('Telemetry');
  });

  it('uses the canonical Daydreams label in the home surface', () => {
    expect(dashboard).toContain('Daydreams');
  });
});

describe('DreamDM divider layout', () => {
  it('keeps enough divider height for the compact DreamDM bar content', () => {
    expect(DIVIDER_H).toBeGreaterThanOrEqual(80);
  });
});
