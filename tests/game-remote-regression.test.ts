import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

describe('existing PS5 remote usage', () => {
  it('keeps GameEngin wired to the shared GameRemote component', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/daydream/GameEngin.tsx'), 'utf8');

    expect(src).toContain("import GameRemote from '@/components/games/GameRemote'");
    expect(src).toContain('<GameRemote embedded');
    expect(src).toContain('if (showRemote) return <GameRemote onBack={() => setShowRemote(false)} />;');
  });

  it('does not reintroduce the old duplicate UniversalDPad controller in GamesHub', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GamesHub.tsx'), 'utf8');

    expect(src).not.toContain('function UniversalDPad');
    expect(src).not.toContain('interface DPadState');
  });
});
