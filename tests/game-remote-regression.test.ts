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

  it('keeps the embedded shared remote generic instead of a MADMAXI controller deck', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GameRemote.tsx'), 'utf8');

    expect(src).toContain('Shared Remote');
    expect(src).toContain("Inline game controls");
    expect(src).not.toContain('controller deck');
    expect(src).not.toContain('Default Remote');
  });

  it('keeps the original remote layout with a larger right analog and wrapped action buttons', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GameRemote.tsx'), 'utf8');

    expect(src).toContain('const RIGHT_PAD_R   = 62');
    expect(src).toContain('const LEFT_PAD_R    = 52');
    expect(src).toContain('RIGHT_STICK_RING_BUTTONS');
    expect(src).toContain("{ sym: 'L1', label: 'Jump+Spin'");
    expect(src).toContain("{ sym: 'R2', label: 'Jump+Shot'");
    expect(src).toContain("{ sym: '△', label: 'Duck'");
    expect(src).toContain('REMOTE_ACTION_PILLS');
    expect(src).toContain("{ sym: 'R1', label: 'Dash'");
  });

  it('does not reintroduce the old duplicate UniversalDPad controller in GamesHub', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GamesHub.tsx'), 'utf8');

    expect(src).not.toContain('function UniversalDPad');
    expect(src).not.toContain('interface DPadState');
  });

  it('removes per-game on-screen remote pads in favor of the shared GameRemote', () => {
    const babylon = readFileSync(join(REPO_ROOT, 'components/games/BabylonSideScroller.tsx'), 'utf8');
    const maze = readFileSync(join(REPO_ROOT, 'components/games/MazeGame.tsx'), 'utf8');
    const snake = readFileSync(join(REPO_ROOT, 'components/games/SnakeGame.tsx'), 'utf8');
    const racing = readFileSync(join(REPO_ROOT, 'components/games/RacingGame.tsx'), 'utf8');
    const rhythm = readFileSync(join(REPO_ROOT, 'components/games/RhythmGame.tsx'), 'utf8');
    const shooter = readFileSync(join(REPO_ROOT, 'components/games/SpaceShooter.tsx'), 'utf8');

    expect(babylon).not.toContain('Virtual D-Pad');
    expect(babylon).not.toContain("handleVpad('jump', true)");
    expect(maze).not.toContain("keysRef.current.add('ArrowUp')");
    expect(snake).not.toContain("(['up','left','down','right'] as Dir[])");
    expect(racing).not.toContain("[['↑','ArrowUp'],['↓','ArrowDown'],['←','ArrowLeft'],['→','ArrowRight']]");
    expect(rhythm).not.toContain('onPointerDown={() => hitLane(i)}');
    expect(shooter).not.toContain('onTouchMove={');
  });

  it('keeps rhythm game playable through shared remote-compatible inputs', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/RhythmGame.tsx'), 'utf8');

    expect(src).toContain("['a', 'ArrowLeft', 'z']");
    expect(src).toContain("['l', 'ArrowRight', ' ']");
    expect(src).toContain('shared GameRemote directions');
  });
});
