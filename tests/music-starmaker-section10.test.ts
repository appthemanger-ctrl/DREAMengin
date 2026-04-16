import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('README §10 Music / StarMakerEngin alignment', () => {
  it('Music Daydream exposes the six specialized StarMakerEngin Dream Windows', () => {
    const src = readFileSync(join(root, 'app/daydream/music/page.tsx'), 'utf-8');

    expect(src).toContain('Track Window');
    expect(src).toContain('Playlist Window');
    expect(src).toContain('Release Window');
    expect(src).toContain('Lyrics Window');
    expect(src).toContain('Audio Project Window');
    expect(src).toContain('Sales / Launch Status Window');
  });
});
