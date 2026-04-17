import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildRecentDestinations,
  getAppRoute,
} from '@/components/dreams/DreamsSpacePanel';

const root = process.cwd();
const src = readFileSync(join(root, 'components/dreams/DreamsSpacePanel.tsx'), 'utf-8');

describe('DreamSpace panel evolution', () => {
  it('surfaces DreamSpace as the visible panel title', () => {
    expect(src).toContain('DreamSpace');
    expect(src).toContain('Pick up where you left off');
  });

  it('builds a user-facing continue and recommendation surface from live activity data', () => {
    expect(src).toContain('computeMomentum');
    expect(src).toContain('generateSuggestions');
    expect(src).toContain('readForgeActivity');
    expect(src).toContain('Continue');
    expect(src).toContain('Recommended for you');
    expect(src).toContain('Quick Return');
  });

  it('uses consumer-friendly navigation labels inside DreamSpace', () => {
    expect(src).toContain('✨ Explore');
    expect(src).toContain('More apps');
    expect(src).not.toContain('Forge Analytics');
  });
});

describe('DreamSpace panel helpers', () => {
  it('maps known engine ids to app routes and ignores unknown ids', () => {
    expect(getAppRoute('music')).toBe('/daydream/music');
    expect(getAppRoute('create')).toBe('/daydream/create');
    expect(getAppRoute('missing')).toBeUndefined();
  });

  it('builds deduped recent destinations with newest activity first', () => {
    const recent = buildRecentDestinations(
      [
        { enginId: 'music', label: 'Opened Music', timestamp: '2026-04-13T09:00:00.000Z' },
        { enginId: 'create', label: 'Opened Create', timestamp: '2026-04-13T09:01:00.000Z' },
      ],
      [
        { enginId: 'music', label: 'Music Live', lastActive: '2026-04-13T09:03:00.000Z', heat: 0.8 },
        { enginId: 'code', label: 'Code Live', lastActive: '2026-04-13T09:02:00.000Z', heat: 0.6 },
      ],
    );

    expect(recent).toEqual([
      expect.objectContaining({ label: 'Opened Music', href: '/daydream/music' }),
      expect.objectContaining({ label: 'Opened Create', href: '/daydream/create' }),
      expect.objectContaining({ label: 'Code Live', href: '/daydream/code' }),
    ]);
  });
});
