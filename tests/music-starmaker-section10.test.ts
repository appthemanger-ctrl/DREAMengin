import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('README §10 Music / StarMakerEngin alignment', () => {
  it('Music Daydream exposes the six specialized StarMakerEngin Dream Windows', () => {
    const src = readFileSync(join(root, 'app/daydream/music/page.tsx'), 'utf-8');

    expect(src).toContain("id: 'track-window'");
    expect(src).toContain("id: 'playlist-window'");
    expect(src).toContain("id: 'release-window'");
    expect(src).toContain("id: 'lyrics-window'");
    expect(src).toContain("id: 'audio-project-window'");
    expect(src).toContain("id: 'launch-status-window'");
  });
});
