import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

describe('Lucid Avenue game slice', () => {
  it('registers Lucid Avenue in the shared GamesHub catalog', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GamesHub.tsx'), 'utf8');

    expect(src).toContain("const LucidAvenue = dynamicImport(() => import('@/components/games/LucidAvenue')");
    expect(src).toContain("id: 'lucid-avenue'");
    expect(src).toContain("label: 'Lucid Avenue'");
    expect(src).toContain('Original LA-inspired retro city quest');
  });

  it('ships an original LA-inspired game flow instead of directly copying pokemon content', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/LucidAvenue.tsx'), 'utf8');

    expect(src).toContain('Lucid Avenue');
    expect(src).toContain('original LA-inspired retro city quest');
    expect(src).toContain('not a copy of the archive’s copyrighted content');
    expect(src).toContain('Collect every signal shard, then reach the observatory.');
  });
});
