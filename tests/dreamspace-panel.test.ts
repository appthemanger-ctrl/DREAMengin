import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

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
