import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const src = readFileSync(join(root, 'components/dreams/DreamsSpacePanel.tsx'), 'utf-8');

describe('DreamSpace panel evolution', () => {
  it('surfaces DreamSpace as the visible panel title', () => {
    expect(src).toContain('DreamSpace');
  });

  it('pulls live pulse data from DREAMfield intelligence sources', () => {
    expect(src).toContain('computeMomentum');
    expect(src).toContain('generateSuggestions');
    expect(src).toContain('readForgeActivity');
  });

  it('keeps a direct launch path into Forge Analytics from DreamSpace', () => {
    expect(src).toContain('/daydream/field');
    expect(src).toContain('Full Dashboard');
  });
});
